"use client";
import { useMemo, useState } from "react";
import { ScrollText } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/States";
import { DataTable, PageHeader } from "@/components/ui/Misc";
import { AsyncView, SearchBox, matches } from "@/components/admin/common";
import { useAsync } from "@/hooks/useAsync";
import { listAuditLogs } from "@/lib/services/admin";
import { formatDateTime } from "@/lib/format";

export default function AdminAuditPage() {
  const state = useAsync(() => listAuditLogs(500), []);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const types = useMemo(() => Array.from(new Set((state.data ?? []).map((l) => l.targetType))).sort(), [state.data]);
  return (
    <div className="space-y-4">
      <PageHeader title="Audit logs" description="Read-only record of sensitive admin actions (latest 500)." />
      <div className="flex flex-wrap gap-3">
        <SearchBox value={q} onChange={setQ} placeholder="Search actor, action, summary" />
        <Select aria-label="Target type" className="sm:max-w-[200px]" value={type} onChange={(e) => setType(e.target.value)} options={[{ value: "", label: "All target types" }, ...types.map((t) => ({ value: t, label: t }))]} />
      </div>
      <AsyncView state={state}>
        {(rows) => {
          const shown = rows.filter((l) => (!type || l.targetType === type) && matches(q, l.actorEmail, l.action, l.summary, l.targetId));
          return (
            <DataTable rows={shown} rowKey={(r) => r.id}
              empty={<EmptyState icon={ScrollText} title={rows.length ? "No matches" : "No audit entries yet"} message={rows.length ? "Try different filters." : "Entries appear when admins change pricing, roles, listings and more."} />}
              columns={[
                { key: "t", header: "When", render: (r) => <span className="whitespace-nowrap">{formatDateTime(r.createdAt)}</span> },
                { key: "a", header: "Actor", render: (r) => r.actorEmail || r.actorId },
                { key: "x", header: "Action", render: (r) => <Badge>{r.action}</Badge> },
                { key: "s", header: "Summary", render: (r) => <div><div>{r.summary}</div>{r.targetId && <div className="text-xs text-muted">{r.targetType} {r.targetId}</div>}</div> },
              ]} />
          );
        }}
      </AsyncView>
    </div>
  );
}
