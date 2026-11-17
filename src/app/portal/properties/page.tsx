"use client";
import { useState } from "react";
import Link from "next/link";
import { Archive, Building2, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { PropertyImage } from "@/components/property/PropertyImage";
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
                <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {rows.map((p) => (
                    <li key={p.id} className="overflow-hidden rounded-2xl border border-line bg-white">
                      <div className="relative">
                        <PropertyImage image={p.images?.[0]} alt={p.title} className="aspect-[16/10] w-full" />
                        <span className="absolute left-3 top-3"><StatusBadge status={p.status} /></span>
                      </div>
                      <div className="p-4">
                        <h3 className="truncate font-heading text-base font-bold text-charcoal">{p.title}</h3>
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted"><MapPin className="h-3.5 w-3.5 shrink-0" />{p.categoryName} in {p.location.town}, {p.location.county}</p>
                        <p className="mt-2 font-heading text-lg font-extrabold text-primary">{formatKES(p.price)}<span className="text-xs font-medium text-muted">{p.listingType === "rent" ? " / month" : ""}</span></p>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                          <span className="rounded-lg border border-line px-2 py-1.5"><b className="block text-sm text-charcoal">{p.stats?.views ?? 0}</b>views</span>
                          <span className="rounded-lg border border-line px-2 py-1.5"><b className="block text-sm text-charcoal">{p.stats?.enquiries ?? 0}</b>enquiries</span>
                          <span className="rounded-lg border border-line px-2 py-1.5"><b className="block text-sm text-charcoal">{p.images?.length ?? 0}</b>photos</span>
                        </div>
                        {p.status === "rejected" && p.rejectionReason && <p className="mt-2 text-xs text-danger">Rejected: {p.rejectionReason}</p>}
                        <Select aria-label="Availability" className="mt-3" value={p.availability} onChange={(e) => run(() => setAvailability(p.id, e.target.value as Availability), "Availability updated.")}
                          options={[{ value: "available", label: "Available" }, { value: "under-offer", label: "Under offer" }, { value: "rented", label: "Rented" }, { value: "sold", label: "Sold" }]} />
                        <LinkButton href={`/portal/properties/${p.id}/edit`} full className="mt-3"><Pencil className="h-4 w-4" /> Edit property</LinkButton>
                        <div className="mt-2 flex items-center justify-between">
                          {p.status === "published" ? <Link href={`/property/${p.slug}`} className="text-xs font-medium text-primary hover:underline">View listing</Link> : <span />}
                          <div className="flex gap-1">
                            {p.status === "archived"
                              ? <Button size="sm" variant="ghost" onClick={() => run(() => setPropertyStatus(p.id, "draft"), "Restored to drafts.")}>Restore</Button>
                              : <Button size="sm" variant="ghost" onClick={() => run(() => setPropertyStatus(p.id, "archived"), "Property archived.")}><Archive className="h-4 w-4" /> Archive</Button>}
                            <Button size="sm" variant="ghost" className="text-danger" onClick={() => setDel(p)}><Trash2 className="h-4 w-4" /> Delete</Button>
                          </div>
                        </div>
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
