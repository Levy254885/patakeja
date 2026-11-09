"use client";
import { useState } from "react";
import Link from "next/link";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge, type Tone } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/States";
import { DataTable, PageHeader, Tabs } from "@/components/ui/Misc";
import { AsyncView, useAction } from "@/components/admin/common";
import { useAsync } from "@/hooks/useAsync";
import { archiveProperty, listReports, setReportStatus } from "@/lib/services/admin";
import { formatDateTime, propertySlug } from "@/lib/format";
import type { ListingReport } from "@/lib/types";

type Filter = "all" | ListingReport["status"];
const TONE: Record<ListingReport["status"], Tone> = { open: "red", reviewing: "amber", resolved: "green", dismissed: "neutral" };
const REASON: Record<ListingReport["reason"], string> = { scam: "Suspected scam", "wrong-info": "Wrong information", unavailable: "No longer available", duplicate: "Duplicate", other: "Other" };

export default function AdminReportsPage() {
  const [filter, setFilter] = useState<Filter>("open");
  const state = useAsync(() => listReports(), []);
  const run = useAction();
  const [archive, setArchive] = useState<ListingReport | null>(null);

  const setStatus = async (r: ListingReport, s: ListingReport["status"]) => { if (await run(() => setReportStatus(r.id, s), "Report updated")) state.reload(); };

  return (
    <div className="space-y-4">
      <PageHeader title="Listing reports" description="Reports submitted by users about listings." />
      <AsyncView state={state}>
        {(all) => {
          const count = (s: Filter) => (s === "all" ? all.length : all.filter((r) => r.status === s).length);
          const rows = filter === "all" ? all : all.filter((r) => r.status === filter);
          return (
            <>
              <Tabs value={filter} onChange={setFilter} tabs={(["open", "reviewing", "resolved", "dismissed", "all"] as Filter[]).map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1), count: count(v) }))} />
              <DataTable rows={rows} rowKey={(r) => r.id}
                empty={<EmptyState icon={Flag} title="No reports here" message="Nothing has been reported in this view." />}
                columns={[
                  { key: "p", header: "Listing", render: (r) => <Link className="font-medium text-forest hover:underline" href={`/property/${propertySlug(r.propertyTitle || "property", r.propertyId)}`}>{r.propertyTitle || r.propertyId}</Link> },
                  { key: "r", header: "Reason", render: (r) => <div><div>{REASON[r.reason] ?? r.reason}</div>{r.details && <p className="mt-1 max-w-xs text-xs text-muted">{r.details}</p>}</div> },
                  { key: "s", header: "Status", render: (r) => <Badge tone={TONE[r.status]}>{r.status}</Badge> },
                  { key: "d", header: "Reported", render: (r) => formatDateTime(r.createdAt) },
                  { key: "a", header: "", className: "text-right", render: (r) => (
                    <div className="flex flex-wrap justify-end gap-2">
                      {r.status === "open" && <Button size="sm" variant="secondary" onClick={() => setStatus(r, "reviewing")}>Review</Button>}
                      {(r.status === "open" || r.status === "reviewing") && <>
                        <Button size="sm" variant="secondary" onClick={() => setStatus(r, "dismissed")}>Dismiss</Button>
                        <Button size="sm" variant="secondary" onClick={() => setStatus(r, "resolved")}>Resolve</Button>
                        <Button size="sm" variant="danger" onClick={() => setArchive(r)}>Archive listing</Button>
                      </>}
                    </div>
                  ) },
                ]} />
            </>
          );
        }}
      </AsyncView>
      <ConfirmDialog open={!!archive} danger title="Archive this listing?" confirmLabel="Archive listing" onClose={() => setArchive(null)}
        message="The listing is removed from public search and the report is marked resolved."
        onConfirm={async () => { if (archive) { const ok = await run(async () => { await archiveProperty(archive.propertyId); await setReportStatus(archive.id, "resolved"); }, "Listing archived"); if (ok) state.reload(); } }} />
    </div>
  );
}
