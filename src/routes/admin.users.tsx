import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { adminGet, adminPost, adminDelete } from "@/lib/api-client";
import { Loader2, Search, Shield, ShieldCheck, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({
  component: UsersPage,
});

type Profile = { id: string; email: string | null; fullName: string | null; createdAt: string };
type RoleRow = { userId: string; role: "admin" | "manager" | "user" };
const ROLES = ["admin", "manager", "user"] as const;
type Role = (typeof ROLES)[number];

function UsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [busy, setBusy] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | Role>("all");

  const load = async () => {
    setBusy(true);
    const data = await adminGet<{ profiles: Profile[]; roles: RoleRow[] }>("/api/admin/users").catch(() => ({ profiles: [], roles: [] }));
    setProfiles(data.profiles);
    setRoles(data.roles);
    setBusy(false);
  };

  useEffect(() => { load(); }, []);

  const rolesByUser = useMemo(() => {
    const map = new Map<string, Set<Role>>();
    for (const r of roles) { const s = map.get(r.userId) || new Set<Role>(); s.add(r.role); map.set(r.userId, s); }
    return map;
  }, [roles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return profiles.filter((p) => {
      if (filter !== "all") { const r = rolesByUser.get(p.id); const has = r?.has(filter) ?? (filter === "user" && !r); if (!has) return false; }
      if (!q) return true;
      return (p.email || "").toLowerCase().includes(q) || (p.fullName || "").toLowerCase().includes(q);
    });
  }, [profiles, rolesByUser, search, filter]);

  const toggleRole = async (userId: string, role: Role) => {
    const current = rolesByUser.get(userId);
    const has = current?.has(role);
    if (has) {
      await adminDelete(`/api/admin/users?userId=${userId}&role=${role}`).catch(() => { toast.error("Failed to remove role"); return; });
      setRoles((prev) => prev.filter((r) => !(r.userId === userId && r.role === role)));
      toast.success(`Removed ${role}`);
    } else {
      await adminPost("/api/admin/users", { userId, role }).catch(() => { toast.error("Failed to add role"); return; });
      setRoles((prev) => [...prev, { userId, role }]);
      toast.success(`Added ${role}`);
    }
  };

  const stats = useMemo(() => ({ total: profiles.length, admins: roles.filter((r) => r.role === "admin").length, managers: roles.filter((r) => r.role === "manager").length }), [profiles, roles]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Stat icon={UserIcon} label="Total users" value={String(stats.total)} />
        <Stat icon={ShieldCheck} label="Admins" value={String(stats.admins)} />
        <Stat icon={Shield} label="Managers" value={String(stats.managers)} />
      </div>
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email…" className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="text-sm border border-border rounded-lg px-3 py-2 bg-background">
          <option value="all">All roles</option>
          <option value="admin">Admins</option>
          <option value="manager">Managers</option>
          <option value="user">Customers</option>
        </select>
      </div>
      {busy ? <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></div> : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 text-center text-muted-foreground text-sm">No users found.</div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="text-left px-4 py-3">User</th><th className="text-left px-4 py-3">Joined</th><th className="text-left px-4 py-3">Roles</th></tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const userRoles = rolesByUser.get(p.id);
                  return (
                    <tr key={p.id} className="border-t border-border">
                      <td className="px-4 py-3"><div className="font-medium">{p.fullName || "—"}</div><div className="text-xs text-muted-foreground">{p.email || p.id.slice(0, 8)}</div></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {ROLES.map((r) => {
                            const has = userRoles?.has(r) ?? false;
                            return (
                              <button key={r} onClick={() => toggleRole(p.id, r)} className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${has ? r === "admin" ? "bg-primary text-primary-foreground border-primary" : r === "manager" ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40" : "bg-muted text-foreground border-border" : "bg-transparent text-muted-foreground border-border hover:bg-muted"}`} title={has ? `Remove ${r}` : `Grant ${r}`}>
                                {has ? "✓ " : "+ "}{r}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <p className="text-xs text-muted-foreground">Click a role chip to grant or revoke that role.</p>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof UserIcon; label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg mb-2 bg-primary/10 text-primary"><Icon className="w-4 h-4" /></div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold text-foreground mt-0.5">{value}</div>
    </div>
  );
}
