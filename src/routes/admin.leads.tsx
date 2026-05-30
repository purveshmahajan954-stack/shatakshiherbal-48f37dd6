import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, Trash2, ChevronDown } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/leads")({
  component: LeadsPage,
});

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: string;
  notes: string | null;
  assigned_to: string | null;
  created_at: string;
};

type Admin = { id: string; full_name: string | null; email: string | null };

const STATUSES = [
  { value: "new", label: "New", color: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300" },
  { value: "in_progress", label: "In Progress", color: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" },
  { value: "completed", label: "Completed", color: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300" },
];

function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [busy, setBusy] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = async () => {
    setBusy(true);
    const [leadsRes, rolesRes] = await Promise.all([
      supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("user_roles").select("user_id").in("role", ["admin", "manager"]),
    ]);
    setLeads((leadsRes.data as Lead[]) || []);

    const adminIds = Array.from(new Set((rolesRes.data || []).map((r: any) => r.user_id)));
    if (adminIds.length) {
      const { data: profs } = await supabase.from("profiles").select("id,full_name,email").in("id", adminIds);
      setAdmins((profs as Admin[]) || []);
    } else {
      setAdmins([]);
    }
    setBusy(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (!q) return true;
      return (
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        (l.phone || "").toLowerCase().includes(q) ||
        l.message.toLowerCase().includes(q)
      );
    });
  }, [leads, search, statusFilter]);

  const update = async (id: string, patch: Partial<Lead>) => {
    const { error } = await supabase.from("contact_messages").update(patch).eq("id", id);
    if (error) {
      toast.error("Update failed");
      return;
    }
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    toast.success("Lead updated");
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this lead?")) return;
    const { error } = await supabase.from("contact_messages").delete().eq("id", id);
    if (error) {
      toast.error("Delete failed");
      return;
    }
    setLeads((prev) => prev.filter((l) => l.id !== id));
    toast.success("Lead deleted");
  };

  const counts = useMemo(() => {
    const c = { new: 0, in_progress: 0, completed: 0 };
    leads.forEach((l) => {
      if (l.status in c) c[l.status as keyof typeof c]++;
    });
    return c;
  }, [leads]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {STATUSES.map((s) => (
          <div key={s.value} className="bg-card border border-border rounded-xl p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
            <div className="text-2xl font-semibold mt-1">{counts[s.value as keyof typeof counts]}</div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, message…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-sm border border-border rounded-lg px-3 py-2 bg-background">
          <option value="all">All statuses</option>
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {busy ? (
        <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 text-center text-muted-foreground text-sm">No leads found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((l) => (
            <LeadRow key={l.id} lead={l} admins={admins} onUpdate={(p) => update(l.id, p)} onDelete={() => remove(l.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function LeadRow({ lead, admins, onUpdate, onDelete }: { lead: Lead; admins: Admin[]; onUpdate: (p: Partial<Lead>) => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(lead.notes || "");
  const status = STATUSES.find((s) => s.value === lead.status) || STATUSES[0];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex flex-wrap items-center gap-3 p-4 text-left hover:bg-muted/30 transition">
        <div className="flex-1 min-w-[180px]">
          <div className="font-semibold">{lead.name}</div>
          <div className="text-xs text-muted-foreground">
            {new Date(lead.created_at).toLocaleString("en-IN")} • {lead.email} • {lead.phone || "no phone"}
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>{status.label}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-border p-4 space-y-4 bg-muted/20">
          <div>
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Message</h4>
            <p className="text-sm whitespace-pre-wrap">{lead.message}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Status</label>
              <select value={lead.status} onChange={(e) => onUpdate({ status: e.target.value })} className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background">
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Assign to</label>
              <select
                value={lead.assigned_to || ""}
                onChange={(e) => onUpdate({ assigned_to: e.target.value || null })}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background"
              >
                <option value="">Unassigned</option>
                {admins.map((a) => (
                  <option key={a.id} value={a.id}>{a.full_name || a.email || a.id.slice(0, 8)}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Internal notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => notes !== (lead.notes || "") && onUpdate({ notes })}
              rows={3}
              className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Add notes (auto-saved when you click out)…"
            />
          </div>
          <div className="flex justify-end">
            <button onClick={onDelete} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-lg transition">
              <Trash2 className="w-4 h-4" /> Delete lead
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
