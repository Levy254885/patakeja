"use client";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";
import { Modal } from "@/components/ui/Modal";
import { DataTable, PageHeader, Tabs } from "@/components/ui/Misc";
import { AsyncView, SearchBox, matches, useAction } from "@/components/admin/common";
import { useAsync } from "@/hooks/useAsync";
import { listLocationNodes, LOCATION_LEVELS, locationId, saveLocationNode, setLocationActive } from "@/lib/services/admin";
import { slugify } from "@/lib/format";
import type { LocationLevel, LocationNode } from "@/lib/types";

const PARENT: Record<LocationLevel, LocationLevel | null> = { county: null, subcounty: "county", ward: "subcounty", town: "ward", estate: "town" };
const label = (l: string) => l[0].toUpperCase() + l.slice(1);

export default function AdminLocationsPage() {
  const state = useAsync(listLocationNodes, []);
  const run = useAction();
  const [level, setLevel] = useState<LocationLevel>("subcounty");
  const [countyId, setCountyId] = useState("047");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const nodes = state.data?.merged ?? [];
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const counties = useMemo(() => nodes.filter((n) => n.level === "county").sort((a, b) => a.name.localeCompare(b.name)), [nodes]);
  const shown = nodes.filter((n) => n.level === level && (level === "county" || n.countyId === countyId) && matches(q, n.name)).sort((a, b) => a.name.localeCompare(b.name));
  const parentLevel = PARENT[level];
  const parentOptions = parentLevel ? nodes.filter((n) => n.level === parentLevel && n.countyId === countyId).sort((a, b) => a.name.localeCompare(b.name)) : [];

  const add = async () => {
    const nm = name.trim();
    if (nm.length < 2) { setErr("Enter a name"); return; }
    if (parentLevel && !parentId) { setErr(`Choose a ${parentLevel}`); return; }
    const id = level === "county" ? `c-${slugify(nm)}` : locationId(level, countyId, nm);
    if (byId.has(id)) { setErr("That name already exists at this level"); return; }
    const node: LocationNode = { id, name: nm, level, slug: slugify(nm), countyId: level === "county" ? id : countyId, active: true, ...(parentLevel ? { parentId } : {}) };
    setBusy(true);
    const ok = await run(() => saveLocationNode(node), `${label(level)} added`);
    setBusy(false);
    if (ok) { setOpen(false); setName(""); state.reload(); }
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Locations" description="County > subcounty > ward > town > estate. Built-in Kenyan data can be hidden; additions are saved in Firestore." action={<Button size="sm" onClick={() => { setOpen(true); setErr(""); setName(""); setParentId(""); }}><Plus className="h-4 w-4" />Add {level}</Button>} />
      <Tabs value={level} onChange={setLevel} tabs={LOCATION_LEVELS.map((l) => ({ value: l, label: label(l) }))} />
      <AsyncView state={state}>
        {(d) => (
          <>
            <div className="flex flex-wrap gap-3">
              {level !== "county" && <Select aria-label="County" className="w-56" value={countyId} onChange={(e) => setCountyId(e.target.value)} options={counties.map((c) => ({ value: c.id, label: c.name }))} />}
              <SearchBox value={q} onChange={setQ} placeholder={`Search ${level}`} />
            </div>
            <DataTable rows={shown} rowKey={(n) => n.id} empty={<EmptyState title={`No ${level} records`} message="Add one with the button above." />}
              columns={[
                { key: "n", header: "Name", render: (n) => n.name },
                ...(level !== "county" ? [{ key: "p", header: "Parent", render: (n: LocationNode) => (n.parentId ? byId.get(n.parentId)?.name ?? n.parentId : "-") }] : []),
                { key: "o", header: "Source", render: (n: LocationNode) => <Badge>{d.remote[n.id] ? "Firestore" : "Built-in"}</Badge> },
                { key: "s", header: "Visible", render: (n: LocationNode) => (n.active === false ? <Badge tone="red">Hidden</Badge> : <Badge tone="green">Visible</Badge>) },
                { key: "a", header: "", className: "text-right", render: (n: LocationNode) => (
                  <Button size="sm" variant="ghost" onClick={async () => { if (await run(() => setLocationActive(n, n.active === false), n.active === false ? "Location shown" : "Location hidden")) state.reload(); }}>{n.active === false ? "Show" : "Hide"}</Button>
                ) },
              ]} />
          </>
        )}
      </AsyncView>
      <Modal open={open} onClose={() => setOpen(false)} title={`Add ${level}`} footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button loading={busy} onClick={add}>Add</Button></>}>
        <div className="space-y-4">
          {level !== "county" && <Select label="County" value={countyId} onChange={(e) => { setCountyId(e.target.value); setParentId(""); }} options={counties.map((c) => ({ value: c.id, label: c.name }))} />}
          {parentLevel && parentLevel !== "county" && <Select label={label(parentLevel)} required placeholder={`Choose a ${parentLevel}`} value={parentId} onChange={(e) => setParentId(e.target.value)} options={parentOptions.map((n) => ({ value: n.id, label: n.name }))} />}
          {parentLevel === "county" && <input type="hidden" value={countyId} readOnly />}
          <Input label="Name" required value={name} error={err} onChange={(e) => setName(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}
