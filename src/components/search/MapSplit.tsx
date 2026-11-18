"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import type { Property } from "@/lib/types";
import { PropertyRowCard } from "@/components/property/PropertyCard";

const ListingsMap = dynamic(() => import("./ListingsMap").then((m) => m.ListingsMap), {
  ssr: false,
  loading: () => <div className="flex h-full w-full items-center justify-center bg-surface text-sm text-muted">Loading map…</div>,
});

/** Map on the left, scrollable listing rows on the right (stacked on phones). */
export function MapSplit({ items }: { items: Property[] }) {
  const [active, setActive] = useState<string | null>(null);
  return (
    <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
      <div className="h-[320px] overflow-hidden rounded-xl border border-line lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]">
        <ListingsMap items={items} activeId={active ?? undefined} onSelect={setActive} className="h-full w-full" />
      </div>
      <div className="space-y-3">
        {items.map((p) => <PropertyRowCard key={p.id} p={p} active={active === p.id} onHover={setActive} />)}
      </div>
    </div>
  );
}
