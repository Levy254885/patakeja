import Link from "next/link";
import { Bath, BedDouble, MapPin, Ruler, Zap } from "lucide-react";
import type { Property } from "@/lib/types";
import { PropertyImage } from "./PropertyImage";
import { Price } from "./Price";
import { SaveButton } from "./SaveButton";
import { DemoBadge, VerifiedBadge, Badge } from "@/components/ui/Badge";

export function PropertyCard({ p }: { p: Property }) {
  const href = `/property/${p.slug || p.id}`;
  const boosted = (p.boostedUntil ?? 0) > Date.now();
  return (
    <article className="group overflow-hidden rounded border border-line bg-white transition-shadow hover:shadow-card">
      <div className="relative">
        <Link href={href} aria-label={p.title}>
          <PropertyImage image={p.images?.[0]} alt={p.title} className="aspect-[3/2] w-full" />
        </Link>
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          <Badge tone="forest">{p.listingType === "rent" ? "For rent" : "For sale"}</Badge>
          {boosted && <Badge tone="gold"><Zap className="h-3 w-3" />Boosted</Badge>}
          {p.availability !== "available" && <Badge tone="amber" className="capitalize">{p.availability.replace("-", " ")}</Badge>}
        </div>
        <SaveButton propertyId={p.id} className="absolute right-2 top-2" />
      </div>
      <div className="space-y-2 p-4">
        <Price amount={p.price} listingType={p.listingType} className="text-lg" />
        <h3 className="line-clamp-1 font-heading text-base font-medium text-charcoal"><Link href={href}>{p.title}</Link></h3>
        <p className="flex items-center gap-1 text-sm text-muted"><MapPin className="h-3.5 w-3.5 shrink-0" />{[p.location.estate ?? p.location.town, p.location.county].filter(Boolean).join(", ")}</p>
        <div className="flex items-center gap-4 text-sm text-charcoal">
          {p.bedrooms !== undefined && <span className="flex items-center gap-1"><BedDouble className="h-4 w-4 text-muted" />{p.bedrooms === 0 ? "Studio" : p.bedrooms}</span>}
          {p.bathrooms !== undefined && <span className="flex items-center gap-1"><Bath className="h-4 w-4 text-muted" />{p.bathrooms}</span>}
          {p.sizeSqm ? <span className="flex items-center gap-1"><Ruler className="h-4 w-4 text-muted" />{p.sizeSqm} m²</span> : p.landSizeAcres ? <span className="flex items-center gap-1"><Ruler className="h-4 w-4 text-muted" />{p.landSizeAcres} ac</span> : null}
        </div>
        {(p.verified || p.isDemo) && <div className="flex gap-1 pt-1">{p.verified && <VerifiedBadge />}{p.isDemo && <DemoBadge />}</div>}
      </div>
    </article>
  );
}

export const PropertyGrid = ({ items }: { items: Property[] }) => (
  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{items.map((p) => <PropertyCard key={p.id} p={p} />)}</div>
);
