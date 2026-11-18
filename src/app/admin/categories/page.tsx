"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageHeader, Tabs } from "@/components/ui/Misc";
import { CrudManager, useAction } from "@/components/admin/common";
import { listAllAmenities, listAllCategories, removeAmenity, removeCategory, saveAmenity, saveCategory, seedCatalogDefaults } from "@/lib/services/admin";
import { slugify } from "@/lib/format";
import type { Amenity, AmenityGroup, CategoryGroup, PropertyCategory } from "@/lib/types";

const CAT_GROUPS = ["residential", "commercial", "land"].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }));
const AM_GROUPS = ["security", "utilities", "comfort", "building", "outdoor", "land"].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }));
const activeBadge = (a: boolean) => <Badge tone={a ? "green" : "neutral"}>{a ? "Active" : "Hidden"}</Badge>;

export default function AdminCategoriesPage() {
  const [tab, setTab] = useState<"categories" | "amenities">("categories");
  const run = useAction();
  const [seedKey, setSeedKey] = useState(0);
  const seed = (which: "categories" | "amenities") => (
    <Button onClick={async () => { if (await run(() => seedCatalogDefaults(which), "Defaults added")) setSeedKey((k) => k + 1); }}>Add default {which}</Button>
  );
  return (
    <div className="space-y-4">
      <PageHeader title="Categories & amenities" description="Control what landlords can pick and what search filters offer. Hidden items stay on existing listings." />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: "categories", label: "Categories" }, { value: "amenities", label: "Amenities" }]} />
      {tab === "categories" ? (
        <CrudManager<PropertyCategory> key={`c${seedKey}`} noun="category" load={listAllCategories} emptyAction={seed("categories")}
          search={(r) => [r.name, r.group]}
          columns={[
            { key: "order", header: "Order", render: (r) => r.order },
            { key: "name", header: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
            { key: "group", header: "Group", render: (r) => <span className="capitalize">{r.group}</span> },
            { key: "active", header: "Status", render: (r) => activeBadge(r.active) },
          ]}
          fields={[
            { key: "name", label: "Name", required: true },
            { key: "group", label: "Group", type: "select", options: CAT_GROUPS, required: true },
            { key: "order", label: "Display order", type: "number" },
            { key: "active", label: "Active (visible to users)", type: "checkbox" },
          ]}
          blank={() => ({ name: "", group: "residential", order: 100, active: true })}
          save={async (v, ex) => {
            const name = String(v.name);
            await saveCategory({ id: ex?.id ?? (slugify(name) || `cat-${Date.now()}`), slug: ex?.slug ?? slugify(name), name, group: v.group as CategoryGroup, order: Number(v.order), active: Boolean(v.active) });
          }}
          remove={(r) => removeCategory(r.id)} />
      ) : (
        <CrudManager<Amenity> key={`a${seedKey}`} noun="amenity" load={listAllAmenities} emptyAction={seed("amenities")}
          search={(r) => [r.name, r.group]}
          columns={[
            { key: "name", header: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
            { key: "group", header: "Group", render: (r) => <span className="capitalize">{r.group}</span> },
            { key: "active", header: "Status", render: (r) => activeBadge(r.active) },
          ]}
          fields={[
            { key: "name", label: "Name", required: true },
            { key: "group", label: "Group", type: "select", options: AM_GROUPS, required: true },
            { key: "active", label: "Active (visible to users)", type: "checkbox" },
          ]}
          blank={() => ({ name: "", group: "comfort", active: true })}
          save={async (v, ex) => {
            const name = String(v.name);
            await saveAmenity({ id: ex?.id ?? (slugify(name) || `am-${Date.now()}`), name, group: v.group as AmenityGroup, active: Boolean(v.active) });
          }}
          remove={(r) => removeAmenity(r.id)} />
      )}
    </div>
  );
}
