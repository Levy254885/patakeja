import type { LocationNode } from "../types";
import { COUNTIES, buildStaticNodes } from "./kenya";
import { slugify } from "../format";

export { COUNTIES };

let STATIC: LocationNode[] | null = null;
export const staticNodes = () => (STATIC ??= buildStaticNodes());

/** Merge admin-managed Firestore nodes over the bundled data (by id). Inactive nodes are hidden. */
export function mergeLocations(remote: LocationNode[] = []): LocationNode[] {
  const map = new Map<string, LocationNode>();
  for (const n of staticNodes()) map.set(n.id, n);
  for (const n of remote) map.set(n.id, { ...map.get(n.id), ...n });
  return [...map.values()].filter((n) => n.active !== false);
}

export interface LocationIndex {
  counties: LocationNode[];
  subcounties: (countyId: string) => LocationNode[];
  /** Towns, estates and wards for a county, alphabetical. */
  areas: (countyId: string) => LocationNode[];
  county: (id: string) => LocationNode | undefined;
}

export function indexLocations(nodes: LocationNode[]): LocationIndex {
  const byName = (a: LocationNode, b: LocationNode) => a.name.localeCompare(b.name);
  const counties = nodes.filter((n) => n.level === "county").sort((a, b) => a.id.localeCompare(b.id));
  return {
    counties,
    subcounties: (cid) => nodes.filter((n) => n.level === "subcounty" && n.countyId === cid).sort(byName),
    areas: (cid) => nodes.filter((n) => ["town", "estate", "ward"].includes(n.level) && n.countyId === cid).sort(byName),
    county: (id) => counties.find((c) => c.id === id),
  };
}

export const STATIC_INDEX = () => indexLocations(staticNodes());
export const countyByName = (name: string) => COUNTIES.find((c) => slugify(c.name) === slugify(name));
export const countyBySlug = (slug: string) => COUNTIES.find((c) => slugify(c.name) === slug);
