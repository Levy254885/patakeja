#!/usr/bin/env node
// Seeds reference data. Idempotent (fixed document ids, merge writes).
// Usage:  cd scripts && npm install && node seed.mjs --project <firebase-project-id> [--demo]
// Auth:   GOOGLE_APPLICATION_CREDENTIALS=<service-account.json>  or  FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
const projectId = opt("project") || process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID;
if (!projectId) { console.error("Pass --project <id> or set GCLOUD_PROJECT."); process.exit(1); }
initializeApp({ projectId });
const db = getFirestore();
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

// Single source of truth stays in src/lib/defaults.ts and src/lib/locations/kenya.ts; parsed here to avoid a TS build step.
const defaults = read("src/lib/defaults.ts");
const categories = [...defaults.matchAll(/\bc\("([^"]+)",\s*"([^"]+)",\s*"(\w+)",\s*(\d+)\)/g)].map((m) => ({ id: m[1], name: m[2], slug: m[1], group: m[3], order: Number(m[4]), active: true }));
const amenities = [...defaults.matchAll(/\ba\("([^"]+)",\s*"([^"]+)",\s*"(\w+)"\)/g)].map((m) => ({ id: m[1], name: m[2], group: m[3], active: true }));
const slugify = (s) => s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-");
const kenya = read("src/lib/locations/kenya.ts");
const counties = [...kenya.matchAll(/\["(\d{3})",\s*"([^"]+)"\]/g)].map((m) => ({ id: m[1], name: m[2], level: "county", countyId: m[1], slug: slugify(m[2]), active: true }));

if (!categories.length || !amenities.length || counties.length !== 47) {
  console.error(`Parsing failed (categories ${categories.length}, amenities ${amenities.length}, counties ${counties.length}). Check regexes against the source files.`);
  process.exit(1);
}

const faqs = [
  ["How do I find a home on PataKeja?", "Use the search on the home page or browse Rent, Sale, Commercial and Land. Filter by county, price, bedrooms and amenities.", "tenants", 1],
  ["Why do I pay KES 50 to see contact details?", "The small fee keeps listings genuine and helps us verify landlords. You pay once per property and keep access.", "tenants", 2],
  ["How do I pay?", "Payments are made by M-Pesa STK push to your phone. You will get a receipt and the contact details immediately after you confirm.", "all", 3],
  ["Is my phone number shown publicly?", "No. Landlord contact details are only visible to people who unlocked the listing, and your own number is never shown to other users.", "all", 4],
  ["How do I list my property?", "Create a landlord or agent account, pay the one-time KES 100 registration, then add your listing. It goes live after review.", "landlords", 5],
  ["What does boosting a listing do?", "A boost (KES 500 for 24 hours) places your listing higher in results and marks it as boosted.", "landlords", 6],
  ["How do I report a suspicious listing?", "Open the listing and use Report listing. Our team reviews every report.", "all", 7],
].map(([question, answer, audience, order]) => ({ id: `faq-${order}`, question, answer, audience, order, published: true }));

const demo = [
  ["Sample 2 bedroom apartment in Kilimani", "rent", "apartment", "residential", 45000, 2, 2, "047", "Nairobi", "Kilimani"],
  ["Sample bedsitter near Madaraka", "rent", "bedsitter", "residential", 9500, 0, 1, "047", "Nairobi", "Madaraka"],
  ["Sample 4 bedroom maisonette in Runda", "sale", "maisonette", "residential", 38000000, 4, 4, "047", "Nairobi", "Runda"],
  ["Sample office space in Westlands", "rent", "office", "commercial", 120000, undefined, 2, "047", "Nairobi", "Westlands"],
  ["Sample quarter acre plot in Ruiru", "sale", "residential-plot", "land", 2500000, undefined, undefined, "022", "Kiambu", "Ruiru"],
  ["Sample 3 bedroom house in Nyali", "rent", "house", "residential", 85000, 3, 3, "001", "Mombasa", "Nyali"],
];

async function writeAll(items) {
  const w = db.bulkWriter();
  for (const [ref, data] of items) w.set(ref, data, { merge: true });
  await w.close();
}

const now = FieldValue.serverTimestamp();
await writeAll([
  ...categories.map((c) => [db.doc(`propertyCategories/${c.id}`), c]),
  ...amenities.map((a) => [db.doc(`amenities/${a.id}`), a]),
  ...counties.map((c) => [db.doc(`locations/${c.id}`), c]),
  ...faqs.map((f) => [db.doc(`faqs/${f.id}`), f]),
  [db.doc("siteSettings/pricing"), {
    landlordRegistration: { amount: 100, enabled: true },
    contactAccess: { amount: 50, enabled: true },
    boost: { amount: 500, enabled: true, durationHours: 24 },
    updatedAt: now, updatedBy: "seed",
  }],
  [db.doc("siteSettings/general"), {
    siteName: "PataKeja", tagline: "Find your place. Make your move.", supportEmail: "support@patakeja.co.ke",
    supportPhone: "", whatsapp: "", requireListingApproval: true,
  }],
]);
console.log(`Seeded ${categories.length} categories, ${amenities.length} amenities, ${counties.length} counties, ${faqs.length} FAQs, pricing 100/50/500, general settings.`);

if (flag("demo")) {
  const catName = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  const items = [];
  demo.forEach(([title, listingType, categoryId, categoryGroup, price, bedrooms, bathrooms, countyId, county, town], i) => {
    const id = `demo${String(i + 1).padStart(4, "0")}`; // no hyphens: slugs end with "-<id>"
    items.push([db.doc(`properties/${id}`), {
      title, slug: `${slugify(title)}-${id}`, description: "Sample listing created by the seed script to preview the layout. Not a real property.",
      listingType, categoryId, categoryName: catName[categoryId], categoryGroup, price,
      ...(listingType === "rent" ? { depositAmount: price } : {}),
      ...(bedrooms !== undefined ? { bedrooms } : {}), ...(bathrooms !== undefined ? { bathrooms } : {}),
      amenities: [], amenityNames: [], location: { countyId, county, town, estate: town },
      images: [], ownerId: "demo-seed", owner: { id: "demo-seed", name: "Demo Lister", role: "agent" },
      status: "published", availability: "available", verified: false, isDemo: true,
      stats: { views: 0, enquiries: 0, unlocks: 0, saves: 0 }, createdAt: now, updatedAt: now, publishedAt: now,
    }]);
    items.push([db.doc(`properties/${id}/private/contact`), { contactName: "Demo Lister", phone: "+254700000000" }]);
  });
  await writeAll(items);
  console.log(`Seeded ${demo.length} demo properties (isDemo: true, no photos). Delete with: properties where isDemo == true.`);
}
