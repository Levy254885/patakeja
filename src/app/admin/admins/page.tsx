"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Field";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/States";
import { Card, DataTable, PageHeader } from "@/components/ui/Misc";
import { AsyncView, useAction } from "@/components/admin/common";
import { useAuth } from "@/context/AuthProvider";
import { useAsync } from "@/hooks/useAsync";
import { findUserByEmail, listAdminUsers, ROLES, setUserRole } from "@/lib/services/admin";
import type { Role } from "@/lib/types";

const roleOptions = ROLES.map((r) => ({ value: r, label: r }));

export default function AdminRolesPage() {
  const { profile } = useAuth();
  const isSuper = profile?.role === "superAdmin";
  const state = useAsync(listAdminUsers, []);
  const run = useAction();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("admin");
  const [err, setErr] = useState("");
  const [finding, setFinding] = useState(false);
  const [pending, setPending] = useState<{ uid: string; label: string; role: Role } | null>(null);

  const lookup = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setErr("Enter a valid email"); return; }
    setErr(""); setFinding(true);
    try {
      const u = await findUserByEmail(email.trim().toLowerCase());
      if (!u) setErr("No user with that email. They must register first.");
      else setPending({ uid: u.uid || u.id, label: u.email, role });
    } catch (e) { setErr(e instanceof Error ? e.message : "Lookup failed"); }
    setFinding(false);
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Roles & admins" description="Administrators and role assignment. Only super admins can change roles." />
      {!isSuper && <p className="rounded border border-line bg-ivory p-3 text-sm text-muted">You can view admins, but only a super admin can change roles.</p>}
      <AsyncView state={state}>
        {(rows) => (
          <DataTable rows={rows} rowKey={(r) => r.id}
            empty={<EmptyState title="No admins found" message="No users with an admin role were returned." />}
            columns={[
              { key: "n", header: "Name", render: (r) => <span className="font-medium">{r.fullName || "-"}</span> },
              { key: "e", header: "Email", render: (r) => r.email },
              { key: "r", header: "Role", render: (r) => <Badge tone={r.role === "superAdmin" ? "forest" : "gold"}>{r.role}</Badge> },
              { key: "a", header: "", className: "text-right", render: (r) => isSuper && (r.uid || r.id) !== profile?.uid
                ? <Button size="sm" variant="secondary" onClick={() => setPending({ uid: r.uid || r.id, label: r.email, role: "customer" })}>Remove admin access</Button> : null },
            ]} />
        )}
      </AsyncView>
      {isSuper && (
        <Card title="Change a user's role" className="max-w-2xl space-y-4 p-5">
          <Input label="User email" type="email" value={email} error={err} onChange={(e) => setEmail(e.target.value)} />
          <Select label="New role" options={roleOptions} value={role} onChange={(e) => setRole(e.target.value as Role)} />
          <Button loading={finding} onClick={lookup}>Review change</Button>
        </Card>
      )}
      <ConfirmDialog open={!!pending} danger={pending?.role === "customer"} title="Change role?" confirmLabel="Change role" onClose={() => setPending(null)}
        message={pending ? `Set ${pending.label} to ${pending.role}. This is recorded in the audit log.` : ""}
        onConfirm={async () => { if (pending) { const ok = await run(() => setUserRole(pending.uid, pending.role), "Role updated"); if (ok) { setEmail(""); state.reload(); } } }} />
    </div>
  );
}
