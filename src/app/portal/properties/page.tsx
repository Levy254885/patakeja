"use client";
import { useState } from "react";
import Link from "next/link";
import { Archive, Building2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/Button";
import { PageHeader, Tabs } from "@/components/ui/Misc";
import { StatusBadge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Field";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { Loadable, useMyProperties } from "@/components/portal/common";
import { deleteProperty, setAvailability, setPropertyStatus } from "@/lib/services/properties";
import { formatKES } from "@/lib/format";
import type { Availability, Property, PublishStatus } from "@/lib/types";

type Filter = "all" | PublishStatus;
const FILTERS: Filter[] = ["all", "published", "pending", "draft", "rejected", "archived"];

export default function PropertiesPage() {
  const state = useMyProperties();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("all");
  const [del, setDel] = useState<Property | null>(null);
  const run = async (fn: () => Promise<void>, ok: string) => {
    try { await fn(); toast.success(ok); state.reload(); } catch (e) { toast.error(e instanceof Error ? e.message : "Something went wrong."); }
  };
  return (
    <>
      <PageHeader title="My properties" action={<LinkButton href="/portal/properties/new"><Plus className="h-4 w-4" /> Add property</LinkButton>} />
      <Loadable state={state}>
        {(all) => {
          const rows = filter === "all" ? all : all.filter((p) => p.status === filter);
          return (
            <>
              <div className="mb-4 overflow-x-auto">
                <Tabs value={filter} onChange={setFilter}
                  tabs={FILTERS.map((f) => ({ value: f, label: f[0].toUpperCase() + f.slice(1), count: f === "all" ? all.length : all.filter((p) => p.status === f).length }))} />
              </div>
              {rows.length === 0 ? (
                <EmptyState icon={Building2} title={all.length ? "No properties with this status" : "No properties yet"} message={all.length ? undefined : "Add your first listing to get started."}
                  action={all.length ? undefined : <LinkButton href="/portal/properties/new">Add property</LinkButton>} />
              ) : (
                <ul className="space-y-3">
                  {rows.map((p) => (
                    <li key={p.id} className="rounded border border-line bg-white p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          {p.status === "published" ? <Link href={`/property/${p.slug}`} className="font-heading text-sm font-semibold text-charcoal hover:text-forest">{p.title}</Link>
                            : <span className="font-heading text-sm font-semibold text-charcoal">{p.title}</span>}
                          <p className="mt-0.5 text-xs text-muted">{p.categoryName} in {p.location.town}, {p.location.county} - {formatKES(p.price)}{p.listingType === "rent" ? " / month" : ""}</p>
                          <p className="mt-0.5 text-xs text-muted">{p.stats?.views ?? 0} views, {p.stats?.enquiries ?? 0} enquiries</p>
                        </div>
                        <StatusBadge status={p.status} />
                      </div>
                      {p.status === "rejected" && p.rejectionReason && <p className="mt-2 text-xs text-danger">Rejected: {p.rejectionReason}</p>}
                      <div className="mt-3 flex flex-wrap items-end gap-2">
                        <Select aria-label="Availability" className="w-40" value={p.availability} onChange={(e) => run(() => setAvailability(p.id, e.target.value as Availability), "Availability updated.")}
                          options={[{ value: "available", label: "Available" }, { value: "under-offer", label: "Under offer" }, { value: "rented", label: "Rented" }, { value: "sold", label: "Sold" }]} />
                        <LinkButton href={`/portal/properties/${p.id}/edit`} variant="secondary" size="sm"><Pencil className="h-4 w-4" /> Edit</LinkButton>
                        {p.status === "archived"
                          ? <Button size="sm" variant="secondary" onClick={() => run(() => setPropertyStatus(p.id, "draft"), "Restored to drafts.")}>Restore</Button>
                          : <Button size="sm" variant="secondary" onClick={() => run(() => setPropertyStatus(p.id, "archived"), "Property archived.")}><Archive className="h-4 w-4" /> Archive</Button>}
                        <Button size="sm" variant="ghost" className="text-danger" onClick={() => setDel(p)}><Trash2 className="h-4 w-4" /> Delete</Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          );
        }}
      </Loadable>
      <ConfirmDialog open={!!del} danger title="Delete this property?" confirmLabel="Delete" onClose={() => setDel(null)}
        message={<>This permanently removes <strong>{del?.title}</strong> and its photos. This cannot be undone.</>}
        onConfirm={async () => { if (!del) return; await run(() => deleteProperty(del), "Property deleted."); setDel(null); }} />
    </>
  );
}
