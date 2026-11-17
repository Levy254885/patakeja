// Server-only helpers shared by the /api routes.
import { NextResponse } from "next/server";
import { FieldValue, adminAuth, adminDb } from "./admin-sdk";
import { mergePricing } from "../pricing";
import type { PricingSettings, Role } from "../types";

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export const ok = (data: unknown = { ok: true }) => NextResponse.json(data);

/** Wraps a route body: turns thrown ApiErrors into JSON { error: { message } } with the right HTTP status. */
export async function run(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ApiError) return NextResponse.json({ error: { message: e.message } }, { status: e.status });
    console.error("API error", e);
    const msg = e instanceof Error && /not configured/i.test(e.message) ? e.message : "Something went wrong. Please try again.";
    return NextResponse.json({ error: { message: msg } }, { status: 500 });
  }
}

export interface Caller { uid: string; email?: string; emailVerified: boolean; role?: Role }

/** Verifies the Firebase ID token in `Authorization: Bearer <token>`. */
export async function getCaller(req: Request): Promise<Caller | null> {
  const h = req.headers.get("authorization") ?? "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (!token) return null;
  try {
    const d = await adminAuth().verifyIdToken(token);
    return { uid: d.uid, email: d.email, emailVerified: d.email_verified === true, role: d.role as Role | undefined };
  } catch {
    return null;
  }
}
export async function requireUser(req: Request): Promise<Caller> {
  const c = await getCaller(req);
  if (!c) throw new ApiError(401, "Please sign in.");
  return c;
}
export const isAdmin = (c: Caller) => c.role === "admin" || c.role === "superAdmin";
export async function requireAdmin(req: Request): Promise<Caller> {
  const c = await requireUser(req);
  if (!isAdmin(c)) throw new ApiError(403, "Admins only.");
  return c;
}
export async function body<T = Record<string, any>>(req: Request): Promise<T> {
  try { return (await req.json()) as T; } catch { throw new ApiError(400, "Invalid request body."); }
}

export async function audit(a: { actorId: string; actorEmail?: string; action: string; targetType: string; targetId?: string; summary: string; before?: unknown; after?: unknown }) {
  const clean = JSON.parse(JSON.stringify({ ...a, actorEmail: a.actorEmail ?? "" }));
  await adminDb().collection("auditLogs").add({ ...clean, createdAt: FieldValue.serverTimestamp() });
}
export async function notify(userId: string, n: { type: "inquiry" | "viewing" | "payment" | "listing" | "system" | "verification"; title: string; body: string; link?: string }) {
  await adminDb().collection("notifications").add({ userId, ...n, read: false, createdAt: FieldValue.serverTimestamp() });
}
export async function getPricingAdmin(): Promise<PricingSettings> {
  const s = await adminDb().doc("siteSettings/pricing").get();
  return mergePricing(s.exists ? (s.data() as Partial<PricingSettings>) : null);
}
export const ROLES: Role[] = ["superAdmin", "admin", "agent", "landlord", "customer"];
export const superAdminEmails = () => (process.env.SUPER_ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
