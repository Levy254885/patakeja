"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BedDouble, Building2, LayoutGrid, Map as MapIcon, MapPin, Search, SlidersHorizontal, Wallet } from "lucide-react";
import Link from "next/link";
import { BottomSheet } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";
import { FilterPanel, type PanelProps } from "./FilterPanel";
import { toQuery } from "./params";

const RENT = [{ k: "r1", l: "Under 20K", min: "", max: "20000" }, { k: "r2", l: "20K – 50K", min: "20000", max: "50000" }, { k: "r3", l: "50K – 100K", min: "50000", max: "100000" }, { k: "r4", l: "100K – 250K", min: "100000", max: "250000" }, { k: "r5", l: "250K and above", min: "250000", max: "" }];
const SALE = [{ k: "s1", l: "Under 5M", min: "", max: "5000000" }, { k: "s2", l: "5M – 15M", min: "5000000", max: "15000000" }, { k: "s3", l: "15M – 50M", min: "15000000", max: "50000000" }, { k: "s4", l: "50M and above", min: "50000000", max: "" }];
const BEDS = ["1", "2", "3", "4", "5"];

const pill = "flex h-11 items-center gap-2 rounded-full border border-line bg-white px-4 text-sm text-charcoal";

/** Pill filter row (Livaspace style) + result count + List/Map switch. */
export function FilterBar({ panel, total }: { panel: PanelProps; total: number }) {
  const router = useRouter();
  const { raw, basePath, fixed } = panel;
  const [v, setV] = useState<Record<string, string>>(raw);
  const [more, setMore] = useState(false);
  const type = fixed.listingType ?? (v.type === "sale" ? "sale" : "rent");
  const presets = type === "sale" ? SALE : RENT;
  const priceKey = presets.find((p) => p.min === (v.min ?? "") && p.max === (v.max ?? ""))?.k ?? "";
  const cats = panel.categories.filter((c) => !(fixed.group ?? v.group) || c.group === (fixed.group ?? v.group));
  const view = raw.view === "map" ? "map" : "list";
  const set = (k: string, val: string) => setV((s) => ({ ...s, [k]: val }));

  const go = (next: Record<string, string>) => router.push(`${basePath}${toQuery({ ...next, type: fixed.listingType ? undefined : next.type, group: fixed.group ? undefined : next.group, q: next.q?.trim(), sort: raw.sort, view: raw.view })}`);
  const submit = (e: React.FormEvent) => { e.preventDefault(); go(v); };
  const viewHref = (m: "list" | "map") => `${basePath}${toQuery({ ...raw, view: m === "map" ? "map" : undefined, page: undefined })}`;
  const onSort = (sort: string) => router.push(`${basePath}${toQuery({ ...raw, sort: sort === "newest" ? undefined : sort })}`);

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible" aria-label="Search listings">
        <label className={cn(pill, "min-w-[200px] flex-1 lg:max-w-xs")}>
          <MapPin className="h-4 w-4 shrink-0 text-muted" />
          <input aria-label="Location" placeholder="Location, estate or town" value={v.q ?? ""} onChange={(e) => set("q", e.target.value)} className="w-full bg-transparent outline-none placeholder:text-muted" />
        </label>
        <label className={cn(pill, "shrink-0")}>
          <Building2 className="h-4 w-4 text-muted" />
          <select aria-label="Property type" value={v.category ?? ""} onChange={(e) => set("category", e.target.value)} className="bg-transparent pr-1 outline-none">
            <option value="">Property type</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className={cn(pill, "shrink-0")}>
          <Wallet className="h-4 w-4 text-muted" />
          <select aria-label="Price range" value={priceKey} onChange={(e) => { const p = presets.find((x) => x.k === e.target.value); setV((s) => ({ ...s, min: p?.min ?? "", max: p?.max ?? "" })); }} className="bg-transparent pr-1 outline-none">
            <option value="">Price range</option>
            {presets.map((p) => <option key={p.k} value={p.k}>KES {p.l}</option>)}
          </select>
        </label>
        <label className={cn(pill, "shrink-0")}>
          <BedDouble className="h-4 w-4 text-muted" />
          <select aria-label="Bedrooms" value={v.beds ?? ""} onChange={(e) => set("beds", e.target.value)} className="bg-transparent pr-1 outline-none">
            <option value="">Beds</option>
            {BEDS.map((b) => <option key={b} value={b}>{b}+ bedrooms</option>)}
          </select>
        </label>
        <button type="submit" className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-white hover:bg-primary-700"><Search className="h-4 w-4" />Search</button>
        <button type="button" onClick={() => setMore(true)} className={cn(pill, "shrink-0 font-medium")}><SlidersHorizontal className="h-4 w-4" />More filters</button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted" aria-live="polite">Result <span className="font-semibold text-charcoal">{total}</span> {total === 1 ? "property" : "properties"}</p>
        <div className="flex items-center gap-2">
          <select aria-label="Sort listings" value={raw.sort ?? "newest"} onChange={(e) => onSort(e.target.value)} className="h-9 rounded-full border border-line bg-white px-3 text-xs text-charcoal outline-none">
            <option value="newest">Newest</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="relevance">Most viewed</option>
          </select>
          <div className="inline-flex rounded-full border border-line bg-white p-0.5 text-xs font-medium">
            <Link href={viewHref("list")} className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5", view === "list" ? "bg-primary-50 text-primary" : "text-muted")}><LayoutGrid className="h-3.5 w-3.5" />List</Link>
            <Link href={viewHref("map")} className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5", view === "map" ? "bg-primary-50 text-primary" : "text-muted")}><MapIcon className="h-3.5 w-3.5" />Map</Link>
          </div>
        </div>
      </div>

      <BottomSheet open={more} onClose={() => setMore(false)} title="More filters">
        <FilterPanel {...panel} onApplied={() => setMore(false)} />
      </BottomSheet>
    </div>
  );
}
