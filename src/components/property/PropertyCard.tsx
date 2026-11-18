import Link from "next/link";
import { MapPin, Zap } from "lucide-react";
import type { Property } from "@/lib/types";
import { PropertyImage } from "./PropertyImage";
import { SaveButton } from "./SaveButton";
import { DemoBadge, VerifiedBadge, Badge } from "@/components/ui/Badge";
import { formatKES } from "@/lib/format";

/** Three-column fact row shown under the title (label above value). */
export function specsOf(p: Property): { label: string; value: string }[] {
  const size = p.sizeSqm ? `${p.sizeSqm} m²` : p.landSizeAcres ? `${p.landSizeAcres} acres` : "n/a";
  if (p.categoryGroup === "residential") {
    return [
      { label: "Size", value: size },
      { label: "Bedrooms", value: p.bedrooms === undefined ? "n/a" : p.bedrooms === 0 ? "Studio" : String(p.bedrooms) },
      { label: "Bathrooms", value: p.bathrooms === undefined ? "n/a" : String(p.bathrooms) },
    ];
  }
  return [
    { label: "Size", value: size },
    { label: "Type", value: p.categoryName },
    { label: "Status", value: p.availability.replace("-", " ") },
  ];
}

export function PricePill({ p, className = "" }: { p: Pick<Property, "price" | "listingType">; className?: string }) {
  return (
    <span className={`rounded-full bg-white px-3 py-1.5 font-heading text-sm font-bold text-charcoal shadow-card ${className}`}>
      {formatKES(p.price)}{p.listingType === "rent" && <span className="text-[11px] font-medium text-muted"> /mo</span>}
    </span>
  );
}

export function PropertyCard({ p }: { p: Property }) {
  const href = `/property/${p.slug || p.id}`;
  const boosted = (p.boostedUntil ?? 0) > Date.now();
  return (
    <article className="group rounded-xl border border-line bg-white p-2 transition-shadow hover:shadow-card">
      <div className="relative overflow-hidden rounded-lg">
        <Link href={href} aria-label={p.title}>
          <PropertyImage image={p.images?.[0]} alt={p.title} className="aspect-[4/3] w-full transition-transform duration-300 group-hover:scale-[1.03]" />
        </Link>
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          <Badge tone="primary">{p.listingType === "rent" ? "For rent" : "For sale"}</Badge>
          {boosted && <Badge tone="accent"><Zap className="h-3 w-3" />Boosted</Badge>}
        </div>
        <SaveButton propertyId={p.id} className="absolute right-2 top-2 rounded-full shadow-card" />
        <PricePill p={p} className="absolute bottom-2 left-2" />
      </div>
      <div className="px-2 pb-2 pt-3">
        <h3 className="line-clamp-1 font-heading text-[15px] font-semibold text-charcoal"><Link href={href}>{p.title}</Link></h3>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted"><MapPin className="h-3 w-3 shrink-0" />{[p.location.estate ?? p.location.town, p.location.county].filter(Boolean).join(", ")}</p>
        <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3">
          {specsOf(p).map((s) => (
            <div key={s.label} className="min-w-0"><dt className="text-[10px] font-medium text-muted">{s.label}</dt><dd className={`truncate text-xs font-semibold text-charcoal ${s.label === "Status" || s.label === "Type" ? "capitalize" : ""}`}>{s.value}</dd></div>
          ))}
        </dl>
        {(p.verified || p.isDemo) && <div className="mt-3 flex flex-wrap gap-1">{p.verified && <VerifiedBadge />}{p.isDemo && <DemoBadge />}</div>}
      </div>
    </article>
  );
}

/** Horizontal card used beside the map (PropertyFinder style). */
export function PropertyRowCard({ p, active, onHover }: { p: Property; active?: boolean; onHover?: (id: string | null) => void }) {
  const href = `/property/${p.slug || p.id}`;
  return (
    <article onMouseEnter={() => onHover?.(p.id)} onMouseLeave={() => onHover?.(null)}
      className={`grid grid-cols-[132px_1fr] gap-3 rounded-xl border bg-white p-2 sm:grid-cols-[180px_1fr] ${active ? "border-primary shadow-card" : "border-line"}`}>
      <Link href={href} className="relative block overflow-hidden rounded-lg" aria-label={p.title}>
        <PropertyImage image={p.images?.[0]} alt={p.title} className="h-full min-h-[116px] w-full" w={500} />
      </Link>
      <div className="flex min-w-0 flex-col py-1 pr-1">
        <p className="text-xs font-semibold text-primary">{p.categoryName} {p.listingType === "rent" ? "for rent" : "for sale"}</p>
        <p className="font-heading text-lg font-bold text-charcoal">{formatKES(p.price)}{p.listingType === "rent" && <span className="text-xs font-medium text-muted"> /mo</span>}</p>
        <p className="truncate text-xs text-muted">{[p.location.estate ?? p.location.town, p.location.county].filter(Boolean).join(", ")}</p>
        <p className="mt-1 text-xs text-charcoal">{specsOf(p).map((s) => `${s.value} ${s.label.toLowerCase()}`).slice(1).join(" · ")}</p>
        <div className="mt-auto flex items-center gap-2 pt-2">
          <Link href={href} className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary-700">View details</Link>
          <SaveButton propertyId={p.id} className="border border-line" />
          {p.isDemo && <DemoBadge />}
        </div>
      </div>
    </article>
  );
}

export const PropertyGrid = ({ items }: { items: Property[] }) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{items.map((p) => <PropertyCard key={p.id} p={p} />)}</div>
);
