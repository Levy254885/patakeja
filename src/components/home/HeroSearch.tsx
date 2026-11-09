"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Segmented, Select } from "@/components/ui/Field";
import { STATIC_INDEX } from "@/lib/locations";
import { toQuery } from "@/components/search/params";

interface Cat { id: string; name: string; group: string }

/** Hero search: sends the visitor to /search with the chosen filters in the query string. */
export function HeroSearch({ categories }: { categories: Cat[] }) {
  const router = useRouter();
  const idx = useMemo(() => STATIC_INDEX(), []);
  const [type, setType] = useState<"rent" | "sale">("rent");
  const [v, setV] = useState<Record<string, string>>({});
  const set = (k: string, val: string) => setV((s) => ({ ...s, [k]: val }));
  const areas = useMemo(() => (v.county ? [...new Set(idx.areas(v.county).map((a) => a.name))] : []), [idx, v.county]);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search${toQuery({ type, category: v.category, county: v.county, town: v.town, min: v.min, max: v.max, beds: v.beds })}`);
  };
  return (
    <form onSubmit={submit} aria-label="Search properties" className="rounded border border-line bg-white p-4 text-charcoal sm:p-5">
      <Segmented value={type} onChange={setType} options={[{ value: "rent", label: "Rent" }, { value: "sale", label: "Buy" }]} />
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select label="Property type" placeholder="Any type" value={v.category ?? ""} onChange={(e) => set("category", e.target.value)} options={categories.map((c) => ({ value: c.id, label: c.name }))} />
        <Select label="County" placeholder="All counties" value={v.county ?? ""} onChange={(e) => setV((s) => ({ ...s, county: e.target.value, town: "" }))} options={idx.counties.map((c) => ({ value: c.id, label: c.name }))} />
        {v.county
          ? <Select label="Town or estate" placeholder="Anywhere" value={v.town ?? ""} onChange={(e) => set("town", e.target.value)} options={areas.map((a) => ({ value: a, label: a }))} />
          : <Input label="Town or estate" placeholder="e.g. Kilimani" value={v.town ?? ""} onChange={(e) => set("town", e.target.value)} />}
        <Select label="Bedrooms" placeholder="Any" value={v.beds ?? ""} onChange={(e) => set("beds", e.target.value)} options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n}+` }))} />
        <Input label="Min price (KES)" type="number" inputMode="numeric" min={0} value={v.min ?? ""} onChange={(e) => set("min", e.target.value)} />
        <Input label="Max price (KES)" type="number" inputMode="numeric" min={0} value={v.max ?? ""} onChange={(e) => set("max", e.target.value)} />
        <div className="flex items-end sm:col-span-2"><Button type="submit" size="lg" full><Search className="h-4 w-4" />Search properties</Button></div>
      </div>
    </form>
  );
}
