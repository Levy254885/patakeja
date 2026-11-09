"use client";
import Link from "next/link";
import { Skeleton, ErrorState } from "@/components/ui/States";
import { PropertyImage } from "@/components/property/PropertyImage";
import type { AsyncState } from "@/hooks/useAsync";
import type { Property } from "@/lib/types";

/** Standard loading / error wrapper for account screens. Empty states are handled by the caller. */
export function Loadable<T>({ state, rows = 3, children }: { state: AsyncState<T>; rows?: number; children: (data: T) => React.ReactNode }) {
  if (state.loading && !state.data) {
    return <div className="space-y-3" aria-busy="true">{Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>;
  }
  if (state.error) return <ErrorState message={state.error} onRetry={state.reload} />;
  if (!state.data) return null;
  return <>{children(state.data)}</>;
}

export const propertyHref = (p: { slug?: string; id: string }) => `/property/${p.slug || p.id}`;

/** Small property summary used in lists (title, place, thumbnail). */
export function PropertyMini({ property, fallbackTitle, propertyId }: { property?: Property; fallbackTitle?: string; propertyId: string }) {
  const title = property?.title ?? fallbackTitle ?? "Listing";
  const place = property ? [property.location.estate ?? property.location.town, property.location.county].filter(Boolean).join(", ") : "No longer listed";
  const inner = (
    <div className="flex items-center gap-3">
      <PropertyImage image={property?.images?.[0]} alt={title} w={160} className="h-14 w-20 shrink-0 rounded" />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-charcoal">{title}</p>
        <p className="truncate text-xs text-muted">{place}</p>
      </div>
    </div>
  );
  return property ? <Link href={propertyHref(property)} className="block hover:opacity-90">{inner}</Link> : <div key={propertyId}>{inner}</div>;
}

export const PURPOSE_LABEL: Record<string, string> = {
  "contact-access": "Contact access",
  "landlord-registration": "Landlord registration",
  boost: "Listing boost",
};
