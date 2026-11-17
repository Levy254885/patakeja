"use client";
import { useState } from "react";
import { Ban, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, PageHeader } from "@/components/ui/Misc";
import { AsyncView, SearchBox, matches, useAction } from "@/components/admin/common";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/context/AuthProvider";
import { listUsers, ROLES, setUserDisabled, setUserRole } from "@/lib/services/admin";
import { formatDate } from "@/lib/format";
import type { Role } from "@/lib/types";

export default function AdminUsersPage() {
  const { role: myRole, user } = useAuth();
  const isSuper = myRole === "superAdmin";
  const state = useAsync(() => listUsers(300), []);
  const run = useAction();
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [pending, setPending] = useState<{ id: string; name: string; role: Role } | null>(null);
  const [toggle, setToggle] = useState<{ id: string; name: string; disabled: boolean } | null>(null);

  return (
    <div className="space-y-4">
      <PageHeader title="Users" description={isSuper ? "Showing the 300 newest accounts. You can change roles." : "Showing the 300 newest accounts. Only a super admin can change roles."} />
      <div className="flex flex-wrap gap-3">
        <SearchBox value={q} onChange={setQ} placeholder="Search name, email, phone" />
        <Select aria-label="Role" className="w-44" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} options={[{ value: "", label: "All roles" }, ...ROLES.map((r) => ({ value: r, label: r }))]} />
      </div>
      <AsyncView state={state}>
        {(rows) => (
          <DataTable rows={rows.filter((u) => (!roleFilter || u.role === roleFilter) && matches(q, u.fullName, u.email, u.phone))} rowKey={(u) => u.id}
            empty={<EmptyState title={rows.length ? "No matches" : "No users yet"} />}
            columns={[
              { key: "n", header: "Name", render: (u) => <div><div className="font-medium">{u.fullName || "-"}</div><div className="text-xs text-muted">{u.email}</div></div> },
              { key: "p", header: "Phone", render: (u) => u.phone || "-" },
              { key: "r", header: "Role", render: (u) => isSuper && u.id !== user?.uid ? (
                <Select aria-label={`Role for ${u.fullName}`} className="w-36" value={u.role} onChange={(e) => setPending({ id: u.id, name: u.fullName || u.email, role: e.target.value as Role })} options={ROLES.map((r) => ({ value: r, label: r }))} />
              ) : <StatusBadge status={u.role} /> },
              { key: "v", header: "Verification", render: (u) => <StatusBadge status={u.verification ?? "none"} /> },
              { key: "d", header: "Joined", render: (u) => formatDate(u.createdAt) },
              { key: "a", header: "", className: "text-right", render: (u) => u.id === user?.uid ? null : (
                <Button size="sm" variant="ghost" onClick={() => setToggle({ id: u.id, name: u.fullName || u.email, disabled: !u.disabled })}>
                  {u.disabled ? <><Check className="h-4 w-4" />Enable</> : <><Ban className="h-4 w-4" />Disable</>}
                </Button>
              ) },
            ]} />
        )}
      </AsyncView>
      <ConfirmDialog open={!!pending} title="Change role" confirmLabel="Change role" onClose={() => setPending(null)}
        message={pending && `Set ${pending.name} to ${pending.role}? This updates their access immediately (they may need to sign in again).`}
        onConfirm={async () => { if (pending && (await run(() => setUserRole(pending.id, pending.role), "Role updated"))) state.reload(); }} />
      <ConfirmDialog open={!!toggle} danger={!!toggle?.disabled} title={toggle?.disabled ? "Disable account" : "Enable account"} confirmLabel={toggle?.disabled ? "Disable" : "Enable"} onClose={() => setToggle(null)}
        message={toggle && `${toggle.disabled ? "Disable" : "Enable"} ${toggle.name}? This sets the disabled flag on their profile document.`}
        onConfirm={async () => { if (toggle && (await run(() => setUserDisabled(toggle.id, toggle.disabled), "Account updated"))) state.reload(); }} />
    </div>
  );
}
