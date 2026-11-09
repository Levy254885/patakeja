import type { CategoryGroup, Furnishing, ListingType, SearchFilters } from "@/lib/types";

export type RawParams = Record<string, string | string[] | undefined>;
/** Query-string keys understood by the listing pages. */
export const FILTER_KEYS = ["type", "group", "category", "county", "town", "q", "min", "max", "beds", "furnishing", "verified", "sort"] as const;
export interface Fixed { listingType?: ListingType; group?: CategoryGroup }

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const num = (v: string | undefined) => {
  if (!v) return undefined;
  const n = Number(v.replace(/,/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

/** Flatten Next's searchParams into plain strings for the keys we know about. */
export function rawFilters(sp: RawParams): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of FILTER_KEYS) {
    const v = first(sp[k])?.trim();
    if (v) out[k] = v.slice(0, 120);
  }
  return out;
}

/** URL search params -> SearchFilters. `fixed` values (set by the page itself) always win. */
export function parseFilters(sp: RawParams, fixed: Fixed = {}): SearchFilters {
  const r = rawFilters(sp);
  const type = r.type === "rent" || r.type === "sale" ? r.type : undefined;
  const group = r.group === "residential" || r.group === "commercial" || r.group === "land" ? r.group : undefined;
  const furnishing = (["unfurnished", "semi-furnished", "furnished"] as Furnishing[]).find((f) => f === r.furnishing);
  const sort = (["newest", "price-asc", "price-desc", "relevance"] as const).find((s) => s === r.sort) ?? "newest";
  const page = Math.max(1, Math.floor(Number(first(sp.page)) || 1));
  return {
    listingType: fixed.listingType ?? type,
    group: fixed.group ?? group,
    category: r.category,
    county: r.county,
    town: r.town,
    q: r.q,
    minPrice: num(r.min),
    maxPrice: num(r.max),
    beds: num(r.beds) || undefined,
    furnishing,
    verified: r.verified === "1" ? true : undefined,
    sort,
    page,
  };
}

export function toQuery(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
  const s = qs.toString();
  return s ? `?${s}` : "";
}
