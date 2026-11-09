import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { HttpsError, type CallableRequest } from "firebase-functions/v2/https";

if (!getApps().length) initializeApp();
export const db = getFirestore();
export { FieldValue, Timestamp, HttpsError };

export type Role = "superAdmin" | "admin" | "agent" | "landlord" | "customer";
export const ROLES: Role[] = ["superAdmin", "admin", "agent", "landlord", "customer"];
export const REGION = process.env.FUNCTIONS_REGION || "us-central1";

const origins = (process.env.ALLOWED_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean);
export const CORS: (string | RegExp)[] = [...origins, "http://localhost:3000"];

export function requireAuth(req: CallableRequest): string {
  if (!req.auth) throw new HttpsError("unauthenticated", "Please sign in.");
  return req.auth.uid;
}
export const roleOf = (req: CallableRequest): Role | null => (req.auth?.token?.role as Role | undefined) ?? null;
export const isAdminReq = (req: CallableRequest) => ["admin", "superAdmin"].includes(roleOf(req) ?? "");
export function requireAdmin(req: CallableRequest): string {
  const uid = requireAuth(req);
  if (!isAdminReq(req)) throw new HttpsError("permission-denied", "Admins only.");
  return uid;
}

export async function audit(a: { actorId: string; actorEmail?: string; action: string; targetType: string; targetId?: string; summary: string; before?: unknown; after?: unknown }) {
  const clean = JSON.parse(JSON.stringify({ ...a, actorEmail: a.actorEmail ?? "" }));
  await db.collection("auditLogs").add({ ...clean, createdAt: FieldValue.serverTimestamp() });
}

export async function notify(userId: string, n: { type: "inquiry" | "viewing" | "payment" | "listing" | "system" | "verification"; title: string; body: string; link?: string }) {
  await db.collection("notifications").add({ userId, ...n, read: false, createdAt: FieldValue.serverTimestamp() });
}

export interface PriceItem { amount: number; enabled: boolean; promoAmount?: number; promoEndsAt?: number }
export interface Pricing { landlordRegistration: PriceItem; contactAccess: PriceItem; boost: PriceItem & { durationHours: number } }
export const DEFAULT_PRICING: Pricing = {
  landlordRegistration: { amount: 100, enabled: true },
  contactAccess: { amount: 50, enabled: true },
  boost: { amount: 500, enabled: true, durationHours: 24 },
};
export async function getPricing(): Promise<Pricing> {
  const s = await db.doc("siteSettings/pricing").get();
  return s.exists ? ({ ...DEFAULT_PRICING, ...(s.data() as Partial<Pricing>) } as Pricing) : DEFAULT_PRICING;
}
/** What a user is charged right now: 0 when disabled, promo price while the promotion runs. */
export function effectiveAmount(i: PriceItem, now = Date.now()): number {
  if (!i.enabled) return 0;
  if (typeof i.promoAmount === "number" && (!i.promoEndsAt || i.promoEndsAt > now)) return i.promoAmount;
  return i.amount;
}
