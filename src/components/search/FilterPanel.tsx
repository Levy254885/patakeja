"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox, Input, Select, Segmented } from "@/components/ui/Field";
import { BottomSheet } from "@/components/ui/Modal";
import { STATIC_INDEX } from "@/lib/locations";
import { toQuery, type Fixed } from "./params";

export interface CategoryOption { id: string; name: string; group: string }

export interface PanelProps {
  basePath: string;
  raw: Record<string, string>;
  categories: CategoryOption[];
  fixed: Fixed;
  /** Show the rent/buy switch (pages that do not fix a listing type). */
  showType?: boolean;
  /** Show the residential/commercial/land selector (the generic search page). */
  showGroup?: boolean;
  showQuery?: boolean;
}

const BEDS = [{ value: "1", label: "1+ bedrooms" }, { value: "2", label: "2+ bedrooms" }, { value: "3", label: "3+ bedrooms" }, { value: "4", label: "4+ bedrooms" }, { value: "5", label: "5+ bedrooms" }];

export function FilterPanel({ basePath, raw, categories, fixed, showType, showGroup, showQuery, onApplied }: PanelProps & { onApplied?: () => void }) {
  const router = useRouter();
  const [v, setV] = useState<Record<string, string>>(raw);
  const set = (k: string, val: string) => setV((s) => ({ ...s, [k]: val }));
  const idx = useMemo(() => STATIC_INDEX(), []);

  const group = fixed.group ?? (v.group || undefined);
  const residential = !group || group === "residential";
  const type = fixed.listingType ?? (v.type === "sale" ? "sale" : v.type === "rent" ? "rent" : "");
  const cats = categories.filter((c) => !group || c.group === group);
  const areas = useMemo(() => {
    if (!v.county) return [];
    const names = new Set(idx.areas(v.county).map((a) => a.name));
    if (v.town) names.add(v.town);
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [idx, v.county, v.town]);

  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    const out: Record<string, string | undefined> = {
      type: fixed.listingType ? undefined : v.type,
      group: fixed.group ? undefined : v.group,
      category: v.category,
      county: v.county,
      town: v.county || v.town ? v.town : undefined,
      q: v.q?.trim(),
      min: v.min?.trim(),
      max: v.max?.trim(),
      beds: residential ? v.beds : undefined,
      furnishing: residential && type !== "sale" ? v.furnishing : undefined,
      verified: v.verified === "1" ? "1" : undefined,
      sort: raw.sort,
    };
    router.push(`${basePath}${toQuery(out)}`);
    onApplied?.();
  };
  const clear = () => {
    setV({});
    router.push(basePath);
    onApplied?.();
  };

  return (
    <form onSubmit={apply} className="space-y-4" aria-label="Filter listings">
      {showQuery && <Input label="Keyword" placeholder="Estate, town or title" value={v.q ?? ""} onChange={(e) => set("q", e.target.value)} />}
      {showType && !fixed.listingType && (
        <div>
          <span className="mb-1.5 block text-sm font-medium text-charcoal">Listing type</span>
          <Segmented value={(v.type as "rent" | "sale" | "") || ""} onChange={(t) => set("type", t)} options={[{ value: "", label: "Any" }, { value: "rent", label: "Rent" }, { value: "sale", label: "Buy" }]} />
        </div>
      )}
      {showGroup && !fixed.group && (
        <Select label="Category group" placeholder="All types" value={v.group ?? ""} onChange={(e) => setV((s) => ({ ...s, group: e.target.value, category: "" }))}
          options={[{ value: "residential", label: "Residential" }, { value: "commercial", label: "Commercial" }, { value: "land", label: "Land" }]} />
      )}
      <Select label="Property type" placeholder="Any type" value={v.category ?? ""} onChange={(e) => set("category", e.target.value)} options={cats.map((c) => ({ value: c.id, label: c.name }))} />
      <Select label="County" placeholder="All counties" value={v.county ?? ""} onChange={(e) => setV((s) => ({ ...s, county: e.target.value, town: "" }))} options={idx.counties.map((c) => ({ value: c.id, label: c.name }))} />
      {v.county ? (
        <Select label="Town or estate" placeholder="Anywhere in county" value={v.town ?? ""} onChange={(e) => set("town", e.target.value)} options={areas.map((a) => ({ value: a, label: a }))} />
      ) : (
        <Input label="Town or estate" placeholder="e.g. Kilimani" value={v.town ?? ""} onChange={(e) => set("town", e.target.value)} />
      )}
      <div className="grid grid-cols-2 gap-3">
        <Input label="Min price (KES)" type="number" inputMode="numeric" min={0} value={v.min ?? ""} onChange={(e) => set("min", e.target.value)} />
        <Input label="Max price (KES)" type="number" inputMode="numeric" min={0} value={v.max ?? ""} onChange={(e) => set("max", e.target.value)} />
      </div>
      {residential && <Select label="Bedrooms" placeholder="Any" value={v.beds ?? ""} onChange={(e) => set("beds", e.target.value)} options={BEDS} />}
      {residential && type !== "sale" && (
        <Select label="Furnishing" placeholder="Any" value={v.furnishing ?? ""} onChange={(e) => set("furnishing", e.target.value)}
          options={[{ value: "unfurnished", label: "Unfurnished" }, { value: "semi-furnished", label: "Semi-furnished" }, { value: "furnished", label: "Furnished" }]} />
      )}
      <Checkbox label="Verified listings only" checked={v.verified === "1"} onChange={(e) => set("verified", e.target.checked ? "1" : "")} />
      <div className="flex gap-2 pt-1">
        <Button type="submit" full>Show results</Button>
        <Button type="button" variant="secondary" onClick={clear}>Clear</Button>
      </div>
    </form>
  );
}

/** Result count, sort control and (below lg) the filter bottom sheet trigger. */
export function ResultsToolbar({ total, panel }: { total: number; panel: PanelProps }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const onSort = (sort: string) => router.push(`${panel.basePath}${toQuery({ ...panel.raw, sort: sort === "newest" ? undefined : sort })}`);
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted" aria-live="polite"><span className="font-medium text-charcoal">{total}</span> {total === 1 ? "listing" : "listings"} found</p>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" className="lg:hidden" onClick={() => setOpen(true)}><SlidersHorizontal className="h-4 w-4" />Filters</Button>
        <label className="flex items-center gap-2 text-sm text-muted">
          <span className="hidden sm:inline">Sort by</span>
          <select aria-label="Sort listings" value={panel.raw.sort ?? "newest"} onChange={(e) => onSort(e.target.value)}
            className="h-9 rounded border border-line bg-white px-2 text-sm text-charcoal focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest">
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="relevance">Most viewed</option>
          </select>
        </label>
      </div>
      <BottomSheet open={open} onClose={() => setOpen(false)} title="Filter listings">
        <FilterPanel {...panel} onApplied={() => setOpen(false)} />
      </BottomSheet>
    </div>
  );
}
