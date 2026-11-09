import { getAuth } from "firebase-admin/auth";
import { onCall } from "firebase-functions/v2/https";
import { createHash } from "node:crypto";
import { CORS, FieldValue, HttpsError, REGION, ROLES, audit, db, getPricing, requireAdmin, requireAuth, type Role } from "./common";

const email = async (uid: string) => (await getAuth().getUser(uid).catch(() => null))?.email ?? "";

export const setUserRole = onCall({ region: REGION, cors: CORS }, async (req) => {
  const actor = requireAuth(req);
  if (req.auth?.token?.role !== "superAdmin") throw new HttpsError("permission-denied", "Only a super admin can change roles.");
  const uid = String(req.data?.uid ?? ""), role = req.data?.role as Role;
  if (!uid || !ROLES.includes(role)) throw new HttpsError("invalid-argument", "uid and a valid role are required.");
  const ref = db.doc(`users/${uid}`);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "User not found.");
  const before = snap.data()!.role as Role;
  if (before === role) return { ok: true };
  if (before === "superAdmin") {
    const n = (await db.collection("users").where("role", "==", "superAdmin").count().get()).data().count;
    if (n <= 1) throw new HttpsError("failed-precondition", "Cannot demote the last super admin.");
  }
  await getAuth().setCustomUserClaims(uid, { role });
  await ref.update({ role, updatedAt: FieldValue.serverTimestamp() });
  await db.doc(`publicProfiles/${uid}`).update({ role }).catch(() => undefined);
  await audit({ actorId: actor, actorEmail: await email(actor), action: "user.role", targetType: "user", targetId: uid, summary: `Role ${before} -> ${role}`, before: { role: before }, after: { role } });
  return { ok: true };
});

const num = (v: unknown, name: string, max = 1_000_000) => {
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > max) throw new HttpsError("invalid-argument", `${name} must be a number between 0 and ${max}.`);
  return Math.round(v);
};
function cleanItem(v: any, name: string, extra = false) {
  if (!v || typeof v !== "object") throw new HttpsError("invalid-argument", `${name} is missing.`);
  const o: Record<string, unknown> = { amount: num(v.amount, `${name} amount`), enabled: v.enabled === true };
  if (v.promoAmount != null) {
    o.promoAmount = num(v.promoAmount, `${name} promo amount`);
    if ((o.promoAmount as number) > (o.amount as number)) throw new HttpsError("invalid-argument", `${name} promo must not exceed the normal price.`);
    if (v.promoEndsAt != null) o.promoEndsAt = num(v.promoEndsAt, `${name} promo end`, 8.64e15);
  }
  if (extra) o.durationHours = Math.max(1, num(v.durationHours, `${name} duration`, 24 * 30));
  return o;
}

export const updatePricing = onCall({ region: REGION, cors: CORS }, async (req) => {
  const actor = requireAdmin(req);
  const d = req.data ?? {};
  const next = {
    landlordRegistration: cleanItem(d.landlordRegistration, "Landlord registration"),
    contactAccess: cleanItem(d.contactAccess, "Contact access"),
    boost: cleanItem(d.boost, "Boost", true),
  };
  const before = await getPricing();
  await db.doc("siteSettings/pricing").set({ ...next, updatedAt: FieldValue.serverTimestamp(), updatedBy: actor });
  await audit({ actorId: actor, actorEmail: await email(actor), action: "pricing.update", targetType: "siteSettings", targetId: "pricing", summary: "Pricing updated", before, after: next });
  return { ok: true };
});

export const broadcastNotification = onCall({ region: REGION, cors: CORS, timeoutSeconds: 300 }, async (req) => {
  const actor = requireAdmin(req);
  const title = String(req.data?.title ?? "").trim(), body = String(req.data?.body ?? "").trim();
  const audience = String(req.data?.audience ?? "all");
  if (!title || title.length > 120 || !body || body.length > 1000) throw new HttpsError("invalid-argument", "Title (max 120) and body (max 1000) are required.");
  if (!["all", "customer", "landlord", "agent", "admin"].includes(audience)) throw new HttpsError("invalid-argument", "Unknown audience.");
  let q: FirebaseFirestore.Query = db.collection("users");
  if (audience === "admin") q = q.where("role", "in", ["admin", "superAdmin"]);
  else if (audience !== "all") q = q.where("role", "==", audience);
  const writer = db.bulkWriter();
  let sent = 0, last: FirebaseFirestore.QueryDocumentSnapshot | undefined;
  for (;;) {
    const page = await (last ? q.orderBy("__name__").startAfter(last) : q.orderBy("__name__")).limit(500).get();
    if (page.empty) break;
    for (const u of page.docs) {
      if (u.data().disabled) continue;
      writer.create(db.collection("notifications").doc(), { userId: u.id, type: "system", title, body, read: false, createdAt: FieldValue.serverTimestamp() });
      sent++;
    }
    last = page.docs[page.docs.length - 1];
  }
  await writer.close();
  await audit({ actorId: actor, actorEmail: await email(actor), action: "notification.broadcast", targetType: "notification", summary: `Broadcast to ${audience} (${sent})`, after: { title, audience, sent } });
  return { ok: true, sent };
});

/** Page view counter. Deduplicated per visitor per day with a marker doc (set a Firestore TTL policy on `viewDedupe.expireAt`). */
export const trackPropertyView = onCall({ region: REGION, cors: CORS }, async (req) => {
  const propertyId = String(req.data?.propertyId ?? "");
  if (!propertyId || propertyId.includes("/")) throw new HttpsError("invalid-argument", "propertyId required.");
  const visitor = req.auth?.uid ?? createHash("sha256").update(String(req.rawRequest.ip ?? "") + String(req.rawRequest.headers["user-agent"] ?? "")).digest("hex").slice(0, 24);
  const day = new Date().toISOString().slice(0, 10);
  const prop = await db.doc(`properties/${propertyId}`).get();
  if (!prop.exists || prop.data()!.status !== "published" || prop.data()!.ownerId === req.auth?.uid) return { ok: true };
  try {
    await db.doc(`viewDedupe/${propertyId}_${visitor}_${day}`).create({ propertyId, expireAt: new Date(Date.now() + 2 * 86400_000) });
  } catch {
    return { ok: true }; // already counted today
  }
  await prop.ref.update({ "stats.views": FieldValue.increment(1) });
  return { ok: true };
});
