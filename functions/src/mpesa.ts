import { timingSafeEqual } from "node:crypto";
import { onCall, onRequest } from "firebase-functions/v2/https";
import type { Transaction } from "firebase-admin/firestore";
import { CORS, FieldValue, HttpsError, REGION, db, effectiveAmount, getPricing, requireAuth } from "./common";

const SECRETS = ["MPESA_CONSUMER_KEY", "MPESA_CONSUMER_SECRET", "MPESA_PASSKEY", "MPESA_CALLBACK_TOKEN"];
type Purpose = "contact-access" | "landlord-registration" | "boost";
const PURPOSES: Purpose[] = ["contact-access", "landlord-registration", "boost"];

const base = () => (process.env.MPESA_ENV === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke");
const need = (k: string) => { const v = process.env[k]; if (!v) throw new HttpsError("failed-precondition", `Payments are not configured (${k}).`); return v; };

/** 07xx / 01xx / +254... / 254... -> 254XXXXXXXXX, or null. */
export function normalisePhone(raw: string): string | null {
  const d = String(raw ?? "").replace(/[\s\-()+]/g, "");
  const m = /^(?:254|0)?([17]\d{8})$/.exec(d);
  return m ? `254${m[1]}` : null;
}

async function accessToken(): Promise<string> {
  const auth = Buffer.from(`${need("MPESA_CONSUMER_KEY")}:${need("MPESA_CONSUMER_SECRET")}`).toString("base64");
  const res = await fetch(`${base()}/oauth/v1/generate?grant_type=client_credentials`, { headers: { Authorization: `Basic ${auth}` } });
  const j = (await res.json().catch(() => ({}))) as { access_token?: string };
  if (!res.ok || !j.access_token) throw new HttpsError("unavailable", "Could not reach M-Pesa. Please try again.");
  return j.access_token;
}
/** yyyyMMddHHmmss in East Africa Time (UTC+3). */
const timestamp = () => new Date(Date.now() + 3 * 3600_000).toISOString().replace(/[-:T]/g, "").slice(0, 14);

/** Shared by the free path and the callback: runs inside a transaction, reads must precede writes. */
async function fulfil(tx: Transaction, p: { id: string; userId: string; purpose: Purpose; propertyId?: string; amount: number }, receipt: string | undefined, boostHours: number) {
  const now = Date.now();
  let propRef, propSnap;
  if (p.purpose === "boost" && p.propertyId) { propRef = db.doc(`properties/${p.propertyId}`); propSnap = await tx.get(propRef); }
  if (p.purpose === "contact-access" && p.propertyId) {
    tx.set(db.doc(`contactUnlocks/${p.userId}_${p.propertyId}`), { userId: p.userId, propertyId: p.propertyId, paymentId: p.id, createdAt: FieldValue.serverTimestamp() });
  } else if (p.purpose === "landlord-registration") {
    tx.set(db.doc(`users/${p.userId}`), { registrationFeePaid: true, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  } else if (p.purpose === "boost" && propRef && propSnap?.exists) {
    const current = Number(propSnap.data()?.boostedUntil ?? 0);
    const startsAt = Math.max(current, now);
    const endsAt = startsAt + boostHours * 3600_000;
    tx.update(propRef, { boostedUntil: endsAt });
    tx.set(db.collection("boostCampaigns").doc(), { propertyId: p.propertyId, ownerId: p.userId, paymentId: p.id, startsAt, endsAt, amount: p.amount, createdAt: FieldValue.serverTimestamp() });
  }
  const text = { "contact-access": "Contact details unlocked", "landlord-registration": "Registration fee received", boost: "Listing boosted" }[p.purpose];
  tx.set(db.collection("notifications").doc(), {
    userId: p.userId, type: "payment", title: text,
    body: receipt ? `M-Pesa receipt ${receipt}. Amount KES ${p.amount}.` : "No charge was applied.",
    link: p.propertyId ? `/property/${p.propertyId}` : "/account/payments", read: false, createdAt: FieldValue.serverTimestamp(),
  });
}

export const initiateMpesaPayment = onCall({ region: REGION, cors: CORS, secrets: SECRETS }, async (req) => {
  const uid = requireAuth(req);
  const purpose = req.data?.purpose as Purpose;
  const propertyId = req.data?.propertyId ? String(req.data.propertyId) : undefined;
  if (!PURPOSES.includes(purpose)) throw new HttpsError("invalid-argument", "Unknown payment purpose.");
  const phone = normalisePhone(req.data?.phone);
  if (!phone) throw new HttpsError("invalid-argument", "Enter a valid Safaricom number, e.g. 0712 345 678.");

  const userSnap = await db.doc(`users/${uid}`).get();
  const user = userSnap.data();
  if (!user || user.disabled) throw new HttpsError("permission-denied", "Account unavailable.");
  const pricing = await getPricing();
  let title: string | undefined;
  let item = pricing.contactAccess;

  if (purpose === "landlord-registration") {
    if (!["landlord", "agent"].includes(user.role)) throw new HttpsError("failed-precondition", "Only landlords and agents pay the registration fee.");
    if (user.registrationFeePaid) return { paymentId: "", amount: 0, message: "Registration is already paid." };
    item = pricing.landlordRegistration;
  } else {
    if (!propertyId) throw new HttpsError("invalid-argument", "propertyId is required.");
    const prop = await db.doc(`properties/${propertyId}`).get();
    if (!prop.exists) throw new HttpsError("not-found", "Property not found.");
    const pd = prop.data()!;
    title = pd.title;
    if (purpose === "contact-access") {
      if (pd.status !== "published") throw new HttpsError("failed-precondition", "This listing is not available.");
      if (pd.ownerId === uid) throw new HttpsError("failed-precondition", "This is your own listing.");
      if ((await db.doc(`contactUnlocks/${uid}_${propertyId}`).get()).exists) return { paymentId: "", amount: 0, message: "You already have access to these contact details." };
    } else {
      if (pd.ownerId !== uid) throw new HttpsError("permission-denied", "You can only boost your own listings.");
      if (pd.status !== "published") throw new HttpsError("failed-precondition", "Only published listings can be boosted.");
      item = pricing.boost;
    }
  }
  const amount = effectiveAmount(item);
  const hours = purpose === "boost" ? pricing.boost.durationHours || 24 : 0;

  // Free (disabled or KES 0 promo): fulfil immediately, still leaving a ledger row.
  if (amount <= 0) {
    const ref = db.collection("payments").doc();
    await db.runTransaction(async (tx) => {
      await fulfil(tx, { id: ref.id, userId: uid, purpose, propertyId, amount: 0 }, undefined, hours);
      tx.set(ref, { userId: uid, purpose, propertyId: propertyId ?? null, propertyTitle: title ?? null, amount: 0, phone, status: "success", resultDesc: "No charge", createdAt: FieldValue.serverTimestamp(), completedAt: FieldValue.serverTimestamp() });
    });
    return { paymentId: ref.id, amount: 0, message: "Done. No charge applied." };
  }

  // Idempotency: reuse a pending request for the same thing made in the last 2 minutes.
  const recent = await db.collection("payments").where("userId", "==", uid).where("status", "==", "pending").get();
  const dup = recent.docs.find((d) => d.data().purpose === purpose && (d.data().propertyId ?? undefined) === propertyId && Date.now() - (d.data().createdAtMs ?? 0) < 120_000);
  if (dup) return { paymentId: dup.id, amount: dup.data().amount, message: "A payment prompt was already sent. Check your phone." };

  const shortcode = need("MPESA_SHORTCODE");
  const ts = timestamp();
  const password = Buffer.from(`${shortcode}${need("MPESA_PASSKEY")}${ts}`).toString("base64");
  const callback = `${need("MPESA_CALLBACK_URL")}${need("MPESA_CALLBACK_URL").includes("?") ? "&" : "?"}token=${encodeURIComponent(need("MPESA_CALLBACK_TOKEN"))}`;
  const token = await accessToken();
  const res = await fetch(`${base()}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      BusinessShortCode: shortcode, Password: password, Timestamp: ts,
      TransactionType: process.env.MPESA_TRANSACTION_TYPE || "CustomerPayBillOnline",
      Amount: amount, PartyA: phone, PartyB: shortcode, PhoneNumber: phone, CallBackURL: callback,
      AccountReference: "PataKeja", TransactionDesc: purpose.slice(0, 20),
    }),
  });
  const j = (await res.json().catch(() => ({}))) as { ResponseCode?: string; CheckoutRequestID?: string; MerchantRequestID?: string; errorMessage?: string; CustomerMessage?: string };
  if (!res.ok || j.ResponseCode !== "0" || !j.CheckoutRequestID) throw new HttpsError("unavailable", j.errorMessage || "M-Pesa did not accept the request. Please try again.");

  await db.doc(`payments/${j.CheckoutRequestID}`).set({
    userId: uid, purpose, propertyId: propertyId ?? null, propertyTitle: title ?? null, amount, phone, status: "pending",
    merchantRequestId: j.MerchantRequestID ?? null, createdAt: FieldValue.serverTimestamp(), createdAtMs: Date.now(), boostHours: hours,
  });
  return { paymentId: j.CheckoutRequestID, amount, message: j.CustomerMessage || "Check your phone and enter your M-Pesa PIN." };
});

const safeEq = (a: string, b: string) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };

export const mpesaCallback = onRequest({ region: REGION, secrets: SECRETS }, async (req, res) => {
  const expected = process.env.MPESA_CALLBACK_TOKEN || "";
  if (req.method !== "POST" || !expected || !safeEq(String(req.query.token ?? ""), expected)) { res.status(403).send("Forbidden"); return; }
  const cb = req.body?.Body?.stkCallback;
  const id = cb?.CheckoutRequestID as string | undefined;
  if (!id) { res.status(400).send("Bad request"); return; }
  const meta: Record<string, unknown> = {};
  for (const it of cb.CallbackMetadata?.Item ?? []) meta[it.Name] = it.Value;
  try {
    await db.runTransaction(async (tx) => {
      const ref = db.doc(`payments/${id}`);
      const snap = await tx.get(ref);
      if (!snap.exists) return; // unknown checkout id: ignore
      const p = snap.data()!;
      if (p.status !== "pending") return; // already processed: idempotent
      const done = { completedAt: FieldValue.serverTimestamp(), resultCode: Number(cb.ResultCode), resultDesc: String(cb.ResultDesc ?? "") };
      if (Number(cb.ResultCode) !== 0) {
        tx.update(ref, { ...done, status: Number(cb.ResultCode) === 1032 ? "cancelled" : "failed" });
        return;
      }
      const paid = Number(meta.Amount);
      if (!Number.isFinite(paid) || paid < p.amount) {
        tx.update(ref, { ...done, status: "failed", resultDesc: `Amount mismatch: expected ${p.amount}, received ${meta.Amount}. Needs manual review.`, mpesaReceipt: meta.MpesaReceiptNumber ?? null, needsReview: true });
        return;
      }
      const receipt = String(meta.MpesaReceiptNumber ?? "");
      await fulfil(tx, { id, userId: p.userId, purpose: p.purpose, propertyId: p.propertyId ?? undefined, amount: p.amount }, receipt, Number(p.boostHours) || 24);
      tx.update(ref, { ...done, status: "success", mpesaReceipt: receipt });
    });
  } catch (e) {
    console.error("mpesaCallback failed", id, e);
    res.status(500).json({ ResultCode: 1, ResultDesc: "Retry" });
    return;
  }
  res.json({ ResultCode: 0, ResultDesc: "Accepted" });
});

