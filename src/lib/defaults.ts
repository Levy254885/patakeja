import type { Amenity, GeneralSettings, PricingSettings, PropertyCategory } from "./types";

/** Used when Firestore settings/lookups have not been seeded yet. Seed with `npm run seed`. */
export const DEFAULT_PRICING: PricingSettings = {
  landlordRegistration: { amount: 100, enabled: true },
  contactAccess: { amount: 50, enabled: true },
  boost: { amount: 500, enabled: true, durationHours: 24 },
};

export const DEFAULT_GENERAL: GeneralSettings = {
  siteName: "PataKeja",
  tagline: "Find your place. Make your move.",
  supportEmail: "support@patakeja.co.ke",
  supportPhone: "",
  whatsapp: "",
  requireListingApproval: true,
};

const c = (id: string, name: string, group: PropertyCategory["group"], order: number): PropertyCategory => ({ id, name, slug: id, group, order, active: true });
export const DEFAULT_CATEGORIES: PropertyCategory[] = [
  c("apartment", "Apartment", "residential", 1),
  c("bedsitter", "Bedsitter", "residential", 2),
  c("studio", "Studio", "residential", 3),
  c("house", "House", "residential", 4),
  c("maisonette", "Maisonette", "residential", 5),
  c("bungalow", "Bungalow", "residential", 6),
  c("villa", "Villa", "residential", 7),
  c("townhouse", "Townhouse", "residential", 8),
  c("office", "Office space", "commercial", 9),
  c("retail", "Retail / Shop", "commercial", 10),
  c("warehouse", "Warehouse", "commercial", 11),
  c("commercial-building", "Commercial building", "commercial", 12),
  c("residential-plot", "Residential plot", "land", 13),
  c("agricultural-land", "Agricultural land", "land", 14),
  c("commercial-plot", "Commercial plot", "land", 15),
];

const a = (id: string, name: string, group: Amenity["group"]): Amenity => ({ id, name, group, active: true });
export const DEFAULT_AMENITIES: Amenity[] = [
  a("security-24h", "24/7 Security", "security"), a("cctv", "CCTV", "security"), a("gated", "Gated community", "security"),
  a("borehole", "Borehole", "utilities"), a("generator", "Backup generator", "utilities"), a("solar-water", "Solar water heating", "utilities"),
  a("water-tank", "Water storage tank", "utilities"), a("fibre", "Fibre internet ready", "utilities"), a("electricity", "Electricity", "utilities"),
  a("parking", "Parking", "building"), a("elevator", "Elevator", "building"), a("pool", "Swimming pool", "building"),
  a("gym", "Gym", "building"), a("dsq", "Domestic staff quarters", "building"), a("playground", "Children's play area", "outdoor"),
  a("balcony", "Balcony", "comfort"), a("garden", "Garden", "outdoor"), a("fitted-kitchen", "Fitted kitchen", "comfort"),
  a("wardrobes", "Built-in wardrobes", "comfort"), a("pet-friendly", "Pet friendly", "comfort"), a("tarmac-road", "Tarmac road access", "land"),
  a("title-deed", "Title deed available", "land"), a("fenced", "Fenced", "land"), a("water-connected", "Water connected", "land"),
];
