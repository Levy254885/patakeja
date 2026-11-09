"use client";
import Link from "next/link";
import { useState } from "react";
import { Archive, BadgeCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, PageHeader, Tabs } from "@/components/ui/Misc";
import { AsyncView, SearchBox, matches, useAction } from "@/components/admin/common";
import { useAsync } from "@/hooks/useAsync";
import { archiveProperty, listAllProperties, PUBLISH_STATUSES, setFeatured, setVerifiedListing } from "@/lib/services/admin";
import { formatDate, formatKES, propertySlug } from "@/lib/format";
import type { Property, PublishStatus } from "@/lib/types";

export default function AdminPropertiesPage() {
  const state = useAsync(() => listAllProperties(300), []);
  const run = useAction();
  const [tab, setTab] = useState<"all" | PublishStatus>("all");
  const [q, setQ] = useState("");
  const [arch, setArch] = useState<Property | null>(null);
  const after = (p: Promise<unknown>, ok: string) => run(() => p, ok).then((r) => r && state.reload());

  return (
    <div className="space-y-4">
      <PageHeader title="Properties" description="The 300 newest listings. Use Approvals to review pending ones." />
      <AsyncView state={state}>
        {(rows) => (
          <>
            <Tabs value={tab} onChange={setTab} tabs={[{ value: "all", label: "All", count: rows.length }, ...PUBLISH_STATUSES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1), count: rows.filter((r) => r.status === s).length }))]} />
            <SearchBox value={q} onChange={setQ} placeholder="Search title, town, owner" />
            <DataTable rows={rows.filter((p) => (tab === "all" || p.status === tab) && matches(q, p.title, p.location?.town, p.owner?.name))} rowKey={(p) => p.id}
              empty={<EmptyState title={rows.length ? "No matches" : "No properties yet"} />}
              columns={[
                { key: "t", header: "Listing", render: (p) => (
                  <div>
                    <Link className="font-medium hover:text-forest" href={`/property/${p.slug || propertySlug(p.title, p.id)}`} target="_blank">{p.title}</Link>
                    <div className="text-xs text-muted">{p.location?.town}, {p.location?.county} · {p.owner?.name}</div>
                  </div>
                ) },
                { key: "pr", header: "Price", render: (p) => formatKES(p.price) },
                { key: "s", header: "Status", render: (p) => <div className="flex flex-wrap gap-1"><StatusBadge status={p.status} />{p.featured && <Badge tone="gold">Featured</Badge>}{p.verified && <Badge tone="green">Verified</Badge>}{p.isDemo && <Badge tone="amber">Sample</Badge>}</div> },
                { key: "d", header: "Created", render: (p) => formatDate(p.createdAt) },
                { key: "a", header: "", className: "text-right", render: (p) => (
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => after(setFeatured(p.id, !p.featured), p.featured ? "Removed from featured" : "Marked featured")}><Star className="h-4 w-4" />{p.featured ? "Unfeature" : "Feature"}</Button>
                    <Button size="sm" variant="ghost" onClick={() => after(setVerifiedListing(p.id, !p.verified), p.verified ? "Verification removed" : "Marked verified")}><BadgeCheck className="h-4 w-4" />{p.verified ? "Unverify" : "Verify"}</Button>
                    {p.status !== "archived" && <Button size="sm" variant="ghost" onClick={() => setArch(p)}><Archive className="h-4 w-4" />Archive</Button>}
                  </div>
                ) },
              ]} />
          </>
        )}
      </AsyncView>
      <ConfirmDialog open={!!arch} danger title="Archive listing" confirmLabel="Archive" onClose={() => setArch(null)} message={arch && `Archive "${arch.title}"? It will no longer be public.`}
        onConfirm={async () => { if (arch) await after(archiveProperty(arch.id), "Listing archived"); }} />
    </div>
  );
}
