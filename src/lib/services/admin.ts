"use client";
/**
 * Admin-side Firestore and callable helpers.
 *
 * Audit logging: `auditLogs` is written by Cloud Functions only. Plain Firestore writes below (approve, feature, suspend,
 * settings...) rely on Firestore rules allowing admins to write and on a backend trigger recording the audit entry.
 * Pricing and roles go through the `updatePricing` / `setUserRole` callables, which audit-log themselves.
 */
import {
  collection, deleteDoc, doc, getAggregateFromServer, getCountFromServer, getDoc, getDocs, limit, orderBy, query, serverTimestamp,
  setDoc, sum, updateDoc, where, writeBatch,
} from "firebase/firestore";
import { callFunction, getDb } from "../firebase/client";
import { clean, fromSnap, fromSnaps } from "../firebase/convert";
import { mergeLocations } from "../locations";
import { slugify } from "../format";
import { DEFAULT_AMENITIES, DEFAULT_CATEGORIES } from "../defaults";
import type {
  Amenity, AuditLog, BoostCampaign, Faq, HelpArticle, Inquiry, ListingReport, LocationLevel, LocationNode, Payment, PricingSettings,
  Property, PropertyCategory, PublishStatus, Role, SupportTicket, UserProfile, VerificationRequest,
} from "../types";

const col = (name: string) => collection(getDb(), name);

async function latest<T extends { id: string }>(name: string, n: number, field = "createdAt"): Promise<T[]> {
  const s = await getDocs(query(col(name), orderBy(field, "desc"), limit(n)));
  return fromSnaps<T>(s.docs);
}

/** Equality filter only (no composite index needed); sorted newest-first on the client. */
async function whereEq<T extends { id: string; createdAt?: number }>(name: string, field: string, value: unknown, n = 500): Promise<T[]> {
  const s = await getDocs(query(col(name), where(field, "==", value), limit(n)));
  return fromSnaps<T>(s.docs).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

async function count(name: string, ...c: unknown[]): Promise<number> {
  const s = await getCountFromServer(query(col(name), ...c));
  return s.data().count as number;
}

// ---------------------------------------------------------------- overview
export interface Overview {
  usersByRole: Record<Role, number>;
  listingsByStatus: Record<PublishStatus, number>;
  revenue: number;
  successfulPayments: number;
  enquiries: number;
  newEnquiries: number;
  pendingVerifications: number;
  openReports: number;
  openTickets: number;
  recentUsers: UserProfile[];
  recentProperties: Property[];
  recentPayments: Payment[];
}

export const ROLES: Role[] = ["superAdmin", "admin", "agent", "landlord", "customer"];
export const PUBLISH_STATUSES: PublishStatus[] = ["draft", "pending", "published", "rejected", "archived"];

export async function getOverview(): Promise<Overview> {
  const [roleCounts, statusCounts, rev, enquiries, newEnquiries, pendingVerifications, openReports, openTickets, recentUsers, recentProperties, recentPayments] = await Promise.all([
    Promise.all(ROLES.map((r) => count("users", where("role", "==", r)))),
    Promise.all(PUBLISH_STATUSES.map((s) => count("properties", where("status", "==", s)))),
    getAggregateFromServer(query(col("payments"), where("status", "==", "success")), { total: sum("amount") }),
    count("inquiries"),
    count("inquiries", where("status", "==", "new")),
    count("verificationRequests", where("status", "==", "pending")),
    count("reports", where("status", "==", "open")),
    count("supportTickets", where("status", "==", "open")),
    latest<UserProfile & { id: string }>("users", 5),
    latest<Property>("properties", 5),
    latest<Payment>("payments", 5),
  ]);
  const usersByRole = Object.fromEntries(ROLES.map((r, i) => [r, roleCounts[i]])) as Record<Role, number>;
  const listingsByStatus = Object.fromEntries(PUBLISH_STATUSES.map((s, i) => [s, statusCounts[i]])) as Record<PublishStatus, number>;
  const agg = rev.data();
  const successfulPayments = await count("payments", where("status", "==", "success"));
  return {
    usersByRole, listingsByStatus, revenue: Number(agg.total ?? 0), successfulPayments, enquiries, newEnquiries,
    pendingVerifications, openReports, openTickets, recentUsers, recentProperties, recentPayments,
  };
}

// ---------------------------------------------------------------- users
export const listUsers = (n = 300) => latest<UserProfile & { id: string }>("users", n);
export async function findUserByEmail(email: string): Promise<(UserProfile & { id: string }) | null> {
  const s = await getDocs(query(col("users"), where("email", "==", email.trim().toLowerCase()), limit(1)));
  return fromSnaps<UserProfile & { id: string }>(s.docs)[0] ?? null;
}
export const listAdminUsers = async (): Promise<(UserProfile & { id: string })[]> => {
  const [a, b] = await Promise.all([whereEq<UserProfile & { id: string }>("users", "role", "admin", 200), whereEq<UserProfile & { id: string }>("users", "role", "superAdmin", 200)]);
  return [...b, ...a];
};
export const setUserDisabled = (uid: string, disabled: boolean) => updateDoc(doc(getDb(), "users", uid), { disabled, updatedAt: serverTimestamp() });
export const setUserRole = (uid: string, role: Role) => callFunction<{ uid: string; role: Role }, { ok?: boolean }>("setUserRole", { uid, role });

// ---------------------------------------------------------------- properties
export const listAllProperties = (n = 300) => latest<Property>("properties", n);
export const listPropertiesByStatus = (status: PublishStatus, n = 300) => whereEq<Property>("properties", "status", status, n);
export const setFeatured = (id: string, featured: boolean) => updateDoc(doc(getDb(), "properties", id), { featured, updatedAt: serverTimestamp() });
export const setVerifiedListing = (id: string, verified: boolean) => updateDoc(doc(getDb(), "properties", id), { verified, updatedAt: serverTimestamp() });
export const archiveProperty = (id: string) => updateDoc(doc(getDb(), "properties", id), { status: "archived", updatedAt: serverTimestamp() });
export const approveProperty = (id: string) =>
  updateDoc(doc(getDb(), "properties", id), { status: "published", rejectionReason: "", publishedAt: serverTimestamp(), updatedAt: serverTimestamp() });
export const rejectProperty = (id: string, reason: string) =>
  updateDoc(doc(getDb(), "properties", id), { status: "rejected", rejectionReason: reason.trim(), updatedAt: serverTimestamp() });

// ---------------------------------------------------------------- verification requests
export async function listVerificationRequests(status?: VerificationRequest["status"]): Promise<VerificationRequest[]> {
  return status ? whereEq<VerificationRequest>("verificationRequests", "status", status) : latest<VerificationRequest>("verificationRequests", 300);
}
export async function reviewVerification(req: VerificationRequest, approve: boolean, reviewerId: string, note?: string) {
  const db = getDb();
  const b = writeBatch(db);
  b.update(doc(db, "verificationRequests", req.id), clean({ status: approve ? "approved" : "rejected", reviewNote: note?.trim() || undefined, reviewedBy: reviewerId, updatedAt: serverTimestamp() }));
  if (req.kind === "property") {
    if (req.propertyId) b.update(doc(db, "properties", req.propertyId), { verified: approve, updatedAt: serverTimestamp() });
  } else {
    b.update(doc(db, "users", req.userId), { verification: approve ? "verified" : "rejected", updatedAt: serverTimestamp() });
  }
  await b.commit();
  if (req.kind !== "property") {
    // The public profile may not exist (it is opt-in), so this one is best effort and never creates the document.
    await updateDoc(doc(db, "publicProfiles", req.userId), { verified: approve }).catch(() => undefined);
  }
}

// ---------------------------------------------------------------- payments / revenue
export const listPayments = (n = 500) => latest<Payment>("payments", n);
export const listSuccessfulPayments = (n = 5000) => whereEq<Payment>("payments", "status", "success", n);
export const getPricingDoc = async (): Promise<PricingSettings | null> => fromSnap<PricingSettings & { id: string }>(await getDoc(doc(getDb(), "siteSettings", "pricing")));
export const updatePricing = (p: PricingSettings) => callFunction<PricingSettings, { ok?: boolean }>("updatePricing", p);

export function paymentsToCsv(rows: Payment[]): string {
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = ["id", "date", "userId", "purpose", "propertyId", "propertyTitle", "amountKES", "phone", "status", "mpesaReceipt", "resultDesc"];
  const lines = rows.map((p) => [p.id, p.createdAt ? new Date(p.createdAt).toISOString() : "", p.userId, p.purpose, p.propertyId, p.propertyTitle, p.amount, p.phone, p.status, p.mpesaReceipt, p.resultDesc].map(esc).join(","));
  return [head.join(","), ...lines].join("\n");
}

// ---------------------------------------------------------------- boosts
export const listBoosts = (n = 300) => latest<BoostCampaign>("boostCampaigns", n);
export async function propertyTitles(ids: string[], max = 100): Promise<Record<string, string>> {
  const uniq = [...new Set(ids)].slice(0, max);
  const rows = await Promise.all(uniq.map((id) => getDoc(doc(getDb(), "properties", id)).then((s) => [id, (s.data() as { title?: string } | undefined)?.title ?? ""] as const).catch(() => [id, ""] as const)));
  return Object.fromEntries(rows);
}

// ---------------------------------------------------------------- locations
export async function listLocationNodes(): Promise<{ merged: LocationNode[]; remote: Record<string, LocationNode> }> {
  const s = await getDocs(col("locations"));
  const remote = fromSnaps<LocationNode>(s.docs);
  // `mergeLocations` hides inactive nodes; the manager needs them, so merge by hand using the same function for the base.
  const base = new Map(mergeLocations([]).map((n) => [n.id, n]));
  for (const n of remote) base.set(n.id, { ...base.get(n.id), ...n });
  return { merged: [...base.values()], remote: Object.fromEntries(remote.map((n) => [n.id, n])) };
}
export const LOCATION_PREFIX: Record<LocationLevel, string> = { county: "", subcounty: "s", ward: "w", town: "t", estate: "e" };
export const LOCATION_LEVELS: LocationLevel[] = ["county", "subcounty", "ward", "town", "estate"];
export function locationId(level: LocationLevel, countyId: string, name: string) {
  return `${countyId}-${LOCATION_PREFIX[level]}-${slugify(name)}`;
}
export const saveLocationNode = (n: LocationNode) => setDoc(doc(getDb(), "locations", n.id), clean({ ...n, active: n.active !== false }), { merge: true });
export const setLocationActive = (n: LocationNode, active: boolean) => saveLocationNode({ ...n, active });

// ---------------------------------------------------------------- categories & amenities
export const listAllCategories = async () => fromSnaps<PropertyCategory>((await getDocs(query(col("propertyCategories"), orderBy("order")))).docs);
export const listAllAmenities = async () => fromSnaps<Amenity>((await getDocs(col("amenities"))).docs);
export const saveCategory = (c: PropertyCategory) => setDoc(doc(getDb(), "propertyCategories", c.id), clean({ ...c }), { merge: true });
export const removeCategory = (id: string) => deleteDoc(doc(getDb(), "propertyCategories", id));
export const saveAmenity = (a: Amenity) => setDoc(doc(getDb(), "amenities", a.id), clean({ ...a }), { merge: true });
export const removeAmenity = (id: string) => deleteDoc(doc(getDb(), "amenities", id));
export async function seedCatalogDefaults(which: "categories" | "amenities") {
  const db = getDb();
  const b = writeBatch(db);
  if (which === "categories") DEFAULT_CATEGORIES.forEach((c) => b.set(doc(db, "propertyCategories", c.id), c));
  else DEFAULT_AMENITIES.forEach((a) => b.set(doc(db, "amenities", a.id), a));
  await b.commit();
}

// ---------------------------------------------------------------- reports
export const listReports = (status?: ListingReport["status"]) => (status ? whereEq<ListingReport>("reports", "status", status) : latest<ListingReport>("reports", 300));
export const setReportStatus = (id: string, status: ListingReport["status"]) => updateDoc(doc(getDb(), "reports", id), { status, updatedAt: serverTimestamp() });

// ---------------------------------------------------------------- notifications (callable, backend-only writes)
export type BroadcastAudience = "all" | "customer" | "landlord" | "agent" | "admin";
export interface BroadcastArgs { title: string; body: string; audience: BroadcastAudience }
export const broadcastNotification = (a: BroadcastArgs) => callFunction<BroadcastArgs, { ok?: boolean; sent?: number }>("broadcastNotification", a);

// ---------------------------------------------------------------- CMS
export const listHelpArticles = async () => fromSnaps<HelpArticle>((await getDocs(query(col("helpArticles"), orderBy("order")))).docs);
export const listFaqs = async () => fromSnaps<Faq>((await getDocs(query(col("faqs"), orderBy("order")))).docs);
export async function saveHelpArticle(a: Omit<HelpArticle, "id"> & { id?: string }) {
  const ref = a.id ? doc(getDb(), "helpArticles", a.id) : doc(col("helpArticles"));
  const { id: _id, ...rest } = a;
  await setDoc(ref, clean({ ...rest, ...(a.id ? {} : { createdAt: serverTimestamp() }), updatedAt: serverTimestamp() }), { merge: true });
}
export const removeHelpArticle = (id: string) => deleteDoc(doc(getDb(), "helpArticles", id));
export async function saveFaq(f: Omit<Faq, "id"> & { id?: string }) {
  const ref = f.id ? doc(getDb(), "faqs", f.id) : doc(col("faqs"));
  const { id: _id, ...rest } = f;
  await setDoc(ref, clean({ ...rest }), { merge: true });
}
export const removeFaq = (id: string) => deleteDoc(doc(getDb(), "faqs", id));

// ---------------------------------------------------------------- tickets
export const listTickets = (status?: SupportTicket["status"]) => (status ? whereEq<SupportTicket>("supportTickets", "status", status) : latest<SupportTicket>("supportTickets", 300));
export const setTicketStatus = (id: string, status: SupportTicket["status"]) => updateDoc(doc(getDb(), "supportTickets", id), { status, updatedAt: serverTimestamp() });

// ---------------------------------------------------------------- enquiries (overview only)
export const listRecentEnquiries = (n = 5) => latest<Inquiry>("inquiries", n);

// ---------------------------------------------------------------- settings
export const saveGeneralSettings = (g: Record<string, unknown>) => setDoc(doc(getDb(), "siteSettings", "general"), clean({ ...g, updatedAt: serverTimestamp() }), { merge: true });

// ---------------------------------------------------------------- audit
export const listAuditLogs = (n = 300) => latest<AuditLog>("auditLogs", n);
