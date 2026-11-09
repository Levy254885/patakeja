// Server-only helpers: read PUBLIC data (published properties, catalog) through the Firestore REST API.
// Firestore rules must allow public reads of status == "published" properties and of the catalog collections.
import type { Amenity, Faq, HelpArticle, Property, PropertyCategory, PublicProfile, SearchFilters } from "../types";
import { DEFAULT_AMENITIES, DEFAULT_CATEGORIES } from "../defaults";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const BASE = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
export const REVALIDATE = 300;

type FsValue = Record<string, any>;

export function decodeValue(v: FsValue): any {
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("nullValue" in v) return null;
  if ("timestampValue" in v) return new Date(v.timestampValue).getTime();
  if ("geoPointValue" in v) return { lat: v.geoPointValue.latitude, lng: v.geoPointValue.longitude };
  if ("arrayValue" in v) return (v.arrayValue.values ?? []).map(decodeValue);
  if ("mapValue" in v) return decodeFields(v.mapValue.fields ?? {});
  return undefined;
}
export function decodeFields(fields: Record<string, FsValue>): any {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(fields)) out[k] = decodeValue(v);
  return out;
}
const decodeDoc = <T,>(d: { name: string; fields?: Record<string, FsValue> }): T =>
  ({ id: d.name.split("/").pop()!, ...decodeFields(d.fields ?? {}) }) as T;

async function request(path: string, init?: RequestInit): Promise<any | null> {
  if (!projectId || !apiKey) return null;
  try {
    const res = await fetch(`${path}${path.includes("?") ? "&" : "?"}key=${apiKey}`, { next: { revalidate: REVALIDATE }, ...init });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function runQuery(structuredQuery: object): Promise<any[]> {
  const json = await request(`${BASE}:runQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ structuredQuery }),
  });
  return Array.isArray(json) ? json.filter((r) => r.document).map((r) => r.document) : [];
}

const eq = (field: string, value: string | boolean) => ({
  fieldFilter: { field: { fieldPath: field }, op: "EQUAL", value: typeof value === "boolean" ? { booleanValue: value } : { stringValue: value } },
});

async function listCollection<T>(name: string): Promise<T[]> {
  const json = await request(`${BASE}/${name}?pageSize=300`);
  return (json?.documents ?? []).map((d: any) => decodeDoc<T>(d));
}

export async function getPublishedProperty(id: string): Promise<Property | null> {
  const json = await request(`${BASE}/properties/${id}`);
  if (!json?.fields) return null;
  const p = decodeDoc<Property>(json);
  return p.status === "published" ? p : null;
}

export const PAGE_SIZE = 12;

/** Fetch published properties narrowed by cheap equality filters, then filter/sort/paginate in memory (does not scale past a few thousand listings; move to Algolia/Typesense). */
export async function searchPublishedProperties(f: SearchFilters, pageSize = PAGE_SIZE): Promise<{ items: Property[]; total: number }> {
  const filters = [eq("status", "published")];
  if (f.listingType) filters.push(eq("listingType", f.listingType));
  if (f.county) filters.push(eq("location.countyId", f.county));
  const docs = await runQuery({
    from: [{ collectionId: "properties" }],
    where: { compositeFilter: { op: "AND", filters } },
    limit: 500,
  });
  let rows = docs.map((d) => decodeDoc<Property>(d));
  if (f.group) rows = rows.filter((p) => p.categoryGroup === f.group);
  if (f.category) rows = rows.filter((p) => p.categoryId === f.category || p.categoryName?.toLowerCase() === f.category!.toLowerCase());
  if (f.availability) rows = rows.filter((p) => p.availability === f.availability);
  if (f.subcounty) rows = rows.filter((p) => p.location.subcounty === f.subcounty);
  if (f.town) rows = rows.filter((p) => p.location.town === f.town || p.location.estate === f.town);
  if (f.minPrice) rows = rows.filter((p) => p.price >= f.minPrice!);
  if (f.maxPrice) rows = rows.filter((p) => p.price <= f.maxPrice!);
  if (f.beds) rows = rows.filter((p) => (p.bedrooms ?? 0) >= f.beds!);
  if (f.baths) rows = rows.filter((p) => (p.bathrooms ?? 0) >= f.baths!);
  if (f.furnishing) rows = rows.filter((p) => p.furnishing === f.furnishing);
  if (f.verified) rows = rows.filter((p) => p.verified);
  if (f.amenities?.length) rows = rows.filter((p) => f.amenities!.every((a) => p.amenities?.includes(a)));
  if (f.q) {
    const q = f.q.toLowerCase();
    rows = rows.filter((p) => [p.title, p.categoryName, p.location.town, p.location.estate, p.location.subcounty, p.location.county, p.location.address].filter(Boolean).join(" ").toLowerCase().includes(q));
  }
  const now = Date.now();
  const boosted = (p: Property) => (p.boostedUntil ?? 0) > now;
  const sorts: Record<string, (a: Property, b: Property) => number> = {
    newest: (a, b) => (b.publishedAt ?? b.createdAt ?? 0) - (a.publishedAt ?? a.createdAt ?? 0),
    relevance: (a, b) => (b.stats?.views ?? 0) - (a.stats?.views ?? 0),
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
  };
  const cmp = sorts[f.sort ?? "newest"] ?? sorts.newest;
  rows.sort((a, b) => Number(boosted(b)) - Number(boosted(a)) || Number(!!b.featured) - Number(!!a.featured) || cmp(a, b));
  const page = Math.max(1, f.page ?? 1);
  return { total: rows.length, items: rows.slice((page - 1) * pageSize, page * pageSize) };
}

export async function getSimilarProperties(p: Property, n = 4): Promise<Property[]> {
  const { items } = await searchPublishedProperties({ listingType: p.listingType, county: p.location.countyId, availability: "available" }, 30);
  return items.filter((x) => x.id !== p.id).sort((a, b) => Number(b.categoryId === p.categoryId) - Number(a.categoryId === p.categoryId) || Math.abs(a.price - p.price) - Math.abs(b.price - p.price)).slice(0, n);
}

export async function getFeaturedProperties(n = 8): Promise<Property[]> {
  const docs = await runQuery({ from: [{ collectionId: "properties" }], where: { compositeFilter: { op: "AND", filters: [eq("status", "published"), eq("featured", true)] } }, limit: n });
  return docs.map((d) => decodeDoc<Property>(d));
}

export async function listAllPublishedIds(): Promise<{ id: string; slug?: string; updatedAt?: number }[]> {
  const docs = await runQuery({ from: [{ collectionId: "properties" }], where: eq("status", "published"), limit: 1000 });
  return docs.map((d) => decodeDoc<Property>(d)).map((p) => ({ id: p.id, slug: p.slug, updatedAt: p.updatedAt }));
}

export async function getCategoriesServer(): Promise<PropertyCategory[]> {
  const rows = await listCollection<PropertyCategory>("propertyCategories");
  return rows.length ? rows.filter((c) => c.active !== false).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) : DEFAULT_CATEGORIES;
}
export async function getAmenitiesServer(): Promise<Amenity[]> {
  const rows = await listCollection<Amenity>("amenities");
  return rows.length ? rows : DEFAULT_AMENITIES;
}
export async function getPublicProfile(id: string): Promise<PublicProfile | null> {
  const json = await request(`${BASE}/publicProfiles/${id}`);
  return json?.fields ? decodeDoc<PublicProfile>(json) : null;
}
export async function listPublicProfiles(): Promise<PublicProfile[]> {
  return listCollection<PublicProfile>("publicProfiles");
}
export async function getPricingServer() {
  const json = await request(`${BASE}/siteSettings/pricing`);
  return json?.fields ? decodeFields(json.fields) : null;
}

export async function listHelpArticlesServer(): Promise<HelpArticle[]> {
  const rows = await listCollection<HelpArticle>("helpArticles");
  return rows.filter((a) => a.published !== false).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
export async function listFaqsServer(): Promise<Faq[]> {
  const rows = await listCollection<Faq>("faqs");
  return rows.filter((f) => f.published !== false).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
