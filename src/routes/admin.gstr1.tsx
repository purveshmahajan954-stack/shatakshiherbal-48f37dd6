import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { adminGet } from "@/lib/api-client";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  Filter,
  Loader2,
  Printer,
  Search,
} from "lucide-react";

export const Route = createFileRoute("/admin/gstr1")({
  component: Gstr1Page,
});

type GstrRow = {
  invoiceNo: string;
  invoiceDate: string;
  orderId: string;
  customerName: string;
  gstin: string | null;
  state: string;
  placeOfSupply: string;
  taxableValue: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  invoiceTotal: number;
  paymentMode: string;
  orderStatus: string;
};

type GstrTotals = {
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  invoiceTotal: number;
};

type SortKey = keyof GstrRow;
type SortDir = "asc" | "desc";

const inr = (v: number) => `₹${v.toFixed(2)}`;
const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

function buildQuery(
  from: string,
  to: string,
  month: string,
  fy: string,
): string {
  const p = new URLSearchParams();
  if (month) { p.set("month", month); return `?${p}`; }
  if (fy) { p.set("fy", fy); return `?${p}`; }
  if (from) p.set("from", from);
  if (to) p.set("to", to);
  return p.toString() ? `?${p}` : "";
}

function generateFYOptions(): { value: string; label: string }[] {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const currentFYStart = month >= 3 ? year : year - 1;
  return Array.from({ length: 5 }, (_, i) => {
    const y = currentFYStart - i;
    const label = `FY ${y}-${String(y + 1).slice(-2)}`;
    return { value: `${y}-${String(y + 1).slice(-2)}`, label };
  });
}

function generateMonthOptions(): { value: string; label: string }[] {
  const opts: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-IN", { month: "long", year: "numeric" });
    opts.push({ value, label });
  }
  return opts;
}

const COLS: { key: SortKey; label: string; align?: "right" }[] = [
  { key: "invoiceNo", label: "Invoice No." },
  { key: "invoiceDate", label: "Invoice Date" },
  { key: "orderId", label: "Order ID" },
  { key: "customerName", label: "Customer Name" },
  { key: "gstin", label: "GSTIN" },
  { key: "state", label: "State" },
  { key: "placeOfSupply", label: "Place of Supply" },
  { key: "taxableValue", label: "Taxable Value", align: "right" },
  { key: "gstRate", label: "GST Rate", align: "right" },
  { key: "cgst", label: "CGST (2.5%)", align: "right" },
  { key: "sgst", label: "SGST (2.5%)", align: "right" },
  { key: "igst", label: "IGST (5%)", align: "right" },
  { key: "totalGst", label: "Total GST", align: "right" },
  { key: "invoiceTotal", label: "Invoice Total", align: "right" },
  { key: "paymentMode", label: "Payment Mode" },
  { key: "orderStatus", label: "Order Status" },
];

const PAGE_SIZE = 25;
const FY_OPTIONS = generateFYOptions();
const MONTH_OPTIONS = generateMonthOptions();

function exportCSV(rows: GstrRow[]) {
  const headers = COLS.map((c) => c.label);
  const escape = (v: string | number | null) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.invoiceNo,
        fmtDate(r.invoiceDate),
        r.orderId.slice(0, 8).toUpperCase(),
        r.customerName,
        r.gstin || "",
        r.state,
        r.placeOfSupply,
        r.taxableValue.toFixed(2),
        "5%",
        r.cgst.toFixed(2),
        r.sgst.toFixed(2),
        r.igst.toFixed(2),
        r.totalGst.toFixed(2),
        r.invoiceTotal.toFixed(2),
        r.paymentMode,
        r.orderStatus,
      ]
        .map(escape)
        .join(","),
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `GSTR1_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportExcel(rows: GstrRow[], totals: GstrTotals) {
  const headers = COLS.map((c) => c.label);
  const esc = (v: string | number | null) =>
    `<td>${String(v ?? "").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>`;
  const bodyRows = rows
    .map(
      (r) =>
        `<tr>${[
          r.invoiceNo,
          fmtDate(r.invoiceDate),
          r.orderId.slice(0, 8).toUpperCase(),
          r.customerName,
          r.gstin || "",
          r.state,
          r.placeOfSupply,
          r.taxableValue.toFixed(2),
          "5%",
          r.cgst.toFixed(2),
          r.sgst.toFixed(2),
          r.igst.toFixed(2),
          r.totalGst.toFixed(2),
          r.invoiceTotal.toFixed(2),
          r.paymentMode,
          r.orderStatus,
        ]
          .map(esc)
          .join("")}</tr>`,
    )
    .join("");
  const totalsRow = `<tr style="font-weight:bold;background:#f0f0f0">
    <td colspan="7">TOTALS</td>
    <td>${totals.taxableValue.toFixed(2)}</td>
    <td></td>
    <td>${totals.cgst.toFixed(2)}</td>
    <td>${totals.sgst.toFixed(2)}</td>
    <td>${totals.igst.toFixed(2)}</td>
    <td>${totals.totalGst.toFixed(2)}</td>
    <td>${totals.invoiceTotal.toFixed(2)}</td>
    <td colspan="2"></td>
  </tr>`;
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:x="urn:schemas-microsoft-com:office:excel"
    xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="UTF-8"></head>
    <body><table border="1">
      <thead><tr>${headers.map((h) => `<th style="background:#dde;font-weight:bold">${h}</th>`).join("")}</tr></thead>
      <tbody>${bodyRows}${totalsRow}</tbody>
    </table></body></html>`;
  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `GSTR1_${new Date().toISOString().slice(0, 10)}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

function Gstr1Page() {
  const [rows, setRows] = useState<GstrRow[]>([]);
  const [totals, setTotals] = useState<GstrTotals>({
    taxableValue: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    totalGst: 0,
    invoiceTotal: 0,
  });
  const [busy, setBusy] = useState(false);
  const [filterMode, setFilterMode] = useState<"range" | "month" | "fy">("fy");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [month, setMonth] = useState("");
  const [fy, setFy] = useState(FY_OPTIONS[0].value);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("invoiceDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  const fetchData = async () => {
    setBusy(true);
    try {
      const q = buildQuery(
        filterMode === "range" ? from : "",
        filterMode === "range" ? to : "",
        filterMode === "month" ? month : "",
        filterMode === "fy" ? fy : "",
      );
      const data = await adminGet<{ rows: GstrRow[]; totals: GstrTotals }>(
        `/api/admin/gstr1${q}`,
      );
      setRows(data.rows || []);
      setTotals(data.totals || { taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalGst: 0, invoiceTotal: 0 });
    } catch {
      setRows([]);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        !q ||
        r.customerName.toLowerCase().includes(q) ||
        r.invoiceNo.toLowerCase().includes(q) ||
        r.orderId.toLowerCase().includes(q) ||
        r.state.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const mul = sortDir === "asc" ? 1 : -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * mul;
      return String(av ?? "").localeCompare(String(bv ?? "")) * mul;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageRows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  };

  const handlePrint = () => {
    const esc = (v: string | number | null) =>
      String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const headerRow = COLS.map((c) => `<th>${esc(c.label)}</th>`).join("");

    const bodyRows = sorted
      .map(
        (r) =>
          `<tr>
            <td>${esc(r.invoiceNo)}</td>
            <td>${esc(fmtDate(r.invoiceDate))}</td>
            <td>${esc(r.orderId.slice(0, 8).toUpperCase())}</td>
            <td>${esc(r.customerName)}</td>
            <td>${esc(r.gstin || "")}</td>
            <td>${esc(r.state)}</td>
            <td>${esc(r.placeOfSupply)}</td>
            <td class="r">${r.taxableValue.toFixed(2)}</td>
            <td class="r">5%</td>
            <td class="r">${r.cgst > 0 ? r.cgst.toFixed(2) : "—"}</td>
            <td class="r">${r.sgst > 0 ? r.sgst.toFixed(2) : "—"}</td>
            <td class="r">${r.igst > 0 ? r.igst.toFixed(2) : "—"}</td>
            <td class="r">${r.totalGst.toFixed(2)}</td>
            <td class="r">${r.invoiceTotal.toFixed(2)}</td>
            <td>${esc(r.paymentMode === "cod" ? "COD" : "Online")}</td>
            <td>${esc(r.orderStatus)}</td>
          </tr>`,
      )
      .join("");

    const totalsRow = `<tr class="tot">
      <td colspan="7">Totals (${sorted.length} invoices)</td>
      <td class="r">${totals.taxableValue.toFixed(2)}</td>
      <td></td>
      <td class="r">${totals.cgst.toFixed(2)}</td>
      <td class="r">${totals.sgst.toFixed(2)}</td>
      <td class="r">${totals.igst.toFixed(2)}</td>
      <td class="r">${totals.totalGst.toFixed(2)}</td>
      <td class="r">${totals.invoiceTotal.toFixed(2)}</td>
      <td colspan="2"></td>
    </tr>`;

    const filterLabel =
      filterMode === "fy" ? `FY ${fy}` :
      filterMode === "month" ? month :
      `${from || "—"} to ${to || "—"}`;

    const origin = window.location.origin;
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>GSTR-1 Report — Shatakshi Herbal</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 9px; margin: 16px; color: #000; }
    /* ── Branded header ── */
    .brand-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #2d5a27;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .brand-left { display: flex; align-items: center; gap: 10px; }
    .brand-left img { height: 52px; width: auto; object-fit: contain; }
    .brand-text { display: flex; flex-direction: column; gap: 1px; }
    .brand-name { font-size: 15px; font-weight: 900; color: #2d5a27; letter-spacing: 0.5px; }
    .brand-tagline { font-size: 8px; color: #555; }
    .brand-web { font-size: 8px; color: #2d5a27; }
    .brand-right { text-align: right; }
    .report-title { font-size: 18px; font-weight: 900; color: #2d5a27; letter-spacing: 1px; }
    .report-sub { font-size: 8px; color: #555; margin-top: 3px; line-height: 1.6; }
    /* ── Table ── */
    table { border-collapse: collapse; width: 100%; margin-top: 4px; }
    th { background: #d4e8d4; border: 1px solid #999; padding: 4px 5px; text-align: left; font-weight: bold; white-space: nowrap; font-size: 8.5px; }
    td { border: 1px solid #ccc; padding: 3px 5px; white-space: nowrap; }
    tr:nth-child(even) td { background: #f7f7f7; }
    .r { text-align: right; }
    .tot td { background: #d4e8d4 !important; font-weight: bold; border-top: 2px solid #2d5a27; }
    .footer { margin-top: 10px; font-size: 8px; color: #777; border-top: 1px solid #ddd; padding-top: 6px; }
    @media print { body { margin: 8px; } }
  </style>
</head>
<body>
  <div class="brand-header">
    <div class="brand-left">
      <img src="${origin}/logo.png" alt="Shatakshi Herbal" />
      <div class="brand-text">
        <div class="brand-name">SHATAKSHI HERBAL</div>
        <div class="brand-tagline">Pure Ayurvedic &nbsp;·&nbsp; AYUSH Certified &nbsp;·&nbsp; 100% Natural</div>
        <div class="brand-web">www.shatakshiherbal.com</div>
      </div>
    </div>
    <div class="brand-right">
      <div class="report-title">GSTR-1 REPORT</div>
      <div class="report-sub">
        Period: ${filterLabel}<br/>
        Generated: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}<br/>
        Total Invoices: ${sorted.length}<br/>
        Seller State: Rajasthan &nbsp;|&nbsp; GST Rate: 5%
      </div>
    </div>
  </div>
  <table>
    <thead><tr>${headerRow}</tr></thead>
    <tbody>${bodyRows}</tbody>
    <tfoot>${totalsRow}</tfoot>
  </table>
  <div class="footer">
    * Intra-state (Rajasthan): CGST 2.5% + SGST 2.5% &nbsp;|&nbsp; Inter-state: IGST 5% &nbsp;|&nbsp; Taxable Value = Order Subtotal (excl. GST &amp; delivery)
  </div>
</body>
</html>`;

    const w = window.open("", "_blank", "width=1400,height=800");
    if (!w) { alert("Please allow popups to print the report."); return; }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 400);
  };

  const statusBadge = (s: string) => {
    const color =
      s === "delivered" ? "bg-green-100 text-green-700" :
      s === "cancelled" ? "bg-red-100 text-red-600" :
      s === "shipped" ? "bg-blue-100 text-blue-700" :
      "bg-yellow-100 text-yellow-700";
    return (
      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${color}`}>
        {s}
      </span>
    );
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronUp className="w-3 h-3 opacity-30" />;
    return sortDir === "asc"
      ? <ChevronUp className="w-3 h-3 text-primary" />
      : <ChevronDown className="w-3 h-3 text-primary" />;
  };

  return (
    <div className="space-y-4 gstr1-print-root">

      <div className="no-print flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-xl font-semibold">GSTR-1 Report</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            GST Return — Outward Supplies (5% fixed rate)
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => exportCSV(sorted)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-muted transition"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            onClick={() => exportExcel(sorted, totals)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-muted transition"
          >
            <Download className="w-3.5 h-3.5" /> Excel
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-muted transition"
          >
            <Printer className="w-3.5 h-3.5" /> Print / PDF
          </button>
        </div>
      </div>

      <div className="no-print bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filter by:</span>
          {(["fy", "month", "range"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setFilterMode(m)}
              className={`px-3 py-1 text-xs rounded-lg capitalize border transition ${
                filterMode === m
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:bg-muted"
              }`}
            >
              {m === "fy" ? "Financial Year" : m === "month" ? "Month" : "Date Range"}
            </button>
          ))}
        </div>

        <div className="flex items-end gap-3 flex-wrap">
          {filterMode === "fy" && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Financial Year</label>
              <select
                value={fy}
                onChange={(e) => setFy(e.target.value)}
                className="border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {FY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )}
          {filterMode === "month" && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All months</option>
                {MONTH_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )}
          {filterMode === "range" && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">From</label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">To</label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </>
          )}
          <button
            onClick={() => { setPage(1); fetchData(); }}
            disabled={busy}
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />}
            Apply
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Taxable Value", value: inr(totals.taxableValue), color: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" },
          { label: "Total CGST", value: inr(totals.cgst), color: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" },
          { label: "Total SGST", value: inr(totals.sgst), color: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" },
          { label: "Total IGST", value: inr(totals.igst), color: "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800" },
          { label: "Total GST", value: inr(totals.totalGst), color: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800" },
          { label: "Grand Total", value: inr(totals.invoiceTotal), color: "bg-primary/5 border-primary/20" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-3 ${s.color}`}>
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className="font-semibold text-sm">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="no-print bg-card border border-border rounded-xl p-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by customer, invoice no., order ID, state…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {busy ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No records found for the selected filters.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto print-table-wrap">
              <table className="w-full text-xs whitespace-nowrap">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {COLS.map((col) => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        className={`px-3 py-2.5 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition no-print-sort ${
                          col.align === "right" ? "text-right" : "text-left"
                        }`}
                      >
                        <span className="inline-flex items-center gap-1">
                          {col.label}
                          <SortIcon col={col.key} />
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r, i) => (
                    <tr
                      key={r.orderId}
                      className={`border-b border-border/50 hover:bg-muted/20 transition ${
                        i % 2 === 0 ? "" : "bg-muted/10"
                      }`}
                    >
                      <td className="px-3 py-2 font-mono font-medium text-primary">{r.invoiceNo}</td>
                      <td className="px-3 py-2 text-muted-foreground">{fmtDate(r.invoiceDate)}</td>
                      <td className="px-3 py-2 font-mono text-muted-foreground">{r.orderId.slice(0, 8).toUpperCase()}</td>
                      <td className="px-3 py-2 font-medium max-w-[140px] truncate">{r.customerName}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.gstin || <span className="italic opacity-50">N/A</span>}</td>
                      <td className="px-3 py-2">{r.state}</td>
                      <td className="px-3 py-2">{r.placeOfSupply}</td>
                      <td className="px-3 py-2 text-right font-mono">{inr(r.taxableValue)}</td>
                      <td className="px-3 py-2 text-right">
                        <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded text-xs font-medium">5%</span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono">{r.cgst > 0 ? inr(r.cgst) : <span className="opacity-40">—</span>}</td>
                      <td className="px-3 py-2 text-right font-mono">{r.sgst > 0 ? inr(r.sgst) : <span className="opacity-40">—</span>}</td>
                      <td className="px-3 py-2 text-right font-mono">{r.igst > 0 ? inr(r.igst) : <span className="opacity-40">—</span>}</td>
                      <td className="px-3 py-2 text-right font-mono font-semibold">{inr(r.totalGst)}</td>
                      <td className="px-3 py-2 text-right font-mono font-semibold">{inr(r.invoiceTotal)}</td>
                      <td className="px-3 py-2 capitalize">{r.paymentMode === "cod" ? "COD" : "Online"}</td>
                      <td className="px-3 py-2">{statusBadge(r.orderStatus)}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-border bg-muted/30 font-semibold">
                    <td colSpan={7} className="px-3 py-2.5 text-sm">
                      Totals ({sorted.length} invoices)
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">{inr(totals.taxableValue)}</td>
                    <td className="px-3 py-2.5" />
                    <td className="px-3 py-2.5 text-right font-mono">{inr(totals.cgst)}</td>
                    <td className="px-3 py-2.5 text-right font-mono">{inr(totals.sgst)}</td>
                    <td className="px-3 py-2.5 text-right font-mono">{inr(totals.igst)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-primary">{inr(totals.totalGst)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-primary">{inr(totals.invoiceTotal)}</td>
                    <td colSpan={2} />
                  </tr>
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="no-print flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 text-xs rounded-lg border transition ${
                          p === page
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="no-print text-xs text-muted-foreground pb-2">
        * Intra-state (Rajasthan): CGST 2.5% + SGST 2.5% &nbsp;|&nbsp; Inter-state: IGST 5% &nbsp;|&nbsp; Seller state: Rajasthan
      </div>
    </div>
  );
}
