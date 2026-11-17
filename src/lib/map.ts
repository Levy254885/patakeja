import type { Property } from "./types";

/** Approximate centre (county headquarters) of each of the 47 counties, keyed by county code. */
export const COUNTY_CENTERS: Record<string, [number, number]> = {
  "001": [-4.0435, 39.6682], "002": [-4.1737, 39.4521], "003": [-3.6305, 39.8499], "004": [-1.5167, 40.0333], "005": [-2.2717, 40.902],
  "006": [-3.396, 38.556], "007": [-0.4532, 39.646], "008": [1.7471, 40.0573], "009": [3.9366, 41.867], "010": [2.3284, 37.9899],
  "011": [0.3546, 37.5822], "012": [0.047, 37.649], "013": [-0.3333, 37.65], "014": [-0.5389, 37.4596], "015": [-1.3667, 38.0106],
  "016": [-1.5177, 37.2634], "017": [-1.7833, 37.6333], "018": [-0.2667, 36.3833], "019": [-0.4201, 36.9476], "020": [-0.4989, 37.2803],
  "021": [-0.721, 37.1526], "022": [-1.1714, 36.8356], "023": [3.1191, 35.5973], "024": [1.2389, 35.1119], "025": [1.0966, 36.6985],
  "026": [1.0191, 35.002], "027": [0.5143, 35.2698], "028": [0.6703, 35.5081], "029": [0.2039, 35.105], "030": [0.4919, 35.743],
  "031": [0.2667, 36.5333], "032": [-0.3031, 36.08], "033": [-1.0783, 35.86], "034": [-1.8523, 36.782], "035": [-0.3689, 35.2863],
  "036": [-0.7813, 35.3416], "037": [0.2827, 34.7519], "038": [0.0833, 34.7167], "039": [0.5635, 34.5606], "040": [0.4608, 34.1115],
  "041": [0.0617, 34.2881], "042": [-0.0917, 34.768], "043": [-0.5273, 34.4571], "044": [-1.0634, 34.4731], "045": [-0.6817, 34.7667],
  "046": [-0.5633, 34.9358], "047": [-1.2864, 36.8172],
};

export interface MapPoint { property: Property; lat: number; lng: number; approximate: boolean }

const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };

/** Exact coordinates when the owner provided them; otherwise the county centre nudged deterministically so pins do not stack. */
export function pointFor(p: Property): MapPoint | null {
  const { lat, lng, countyId } = p.location;
  if (typeof lat === "number" && typeof lng === "number") return { property: p, lat, lng, approximate: false };
  const c = COUNTY_CENTERS[countyId];
  if (!c) return null;
  const h = hash(p.id);
  const dLat = ((h % 1000) / 1000 - 0.5) * 0.08;
  const dLng = (((h >> 10) % 1000) / 1000 - 0.5) * 0.08;
  return { property: p, lat: c[0] + dLat, lng: c[1] + dLng, approximate: true };
}

export const shortPrice = (n: number) => (n >= 1_000_000 ? `${+(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}K` : String(n));
