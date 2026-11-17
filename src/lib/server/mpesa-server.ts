// Server-only M-Pesa (Daraja) helpers.
import { FieldValue, adminDb } from "./admin-sdk";
import { ApiError } from "./api";

export type Purpose = "contact-access" | "landlord-registration" | "boost";
export const PURPOSES: Purpose[] = ["contact-access", "landlord-registration", "boost"];

export const mpesaBase = () => (process.env.MPESA_ENV === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke");
export const need = (k: string) => {
  const v = process.env[k];
  if (!v) throw new ApiError(503, `Payments are not configured yet (${k} is missing in Vercel).`);
  return v;
};

/** 07xx / 01xx / +254... / 254... -> 254XXXXXXXXX, or null. */
export function normalisePhone(raw: string): string | null {
  const d = String(raw ?? "").replace(/[\s\-()+]/g, "");
  const m = /^(?:254|0)?([17]\d{8})$/.exec(d);
  return m ? `254${m[1]}` : null;
}

export async function accessToken(): Promise<string> {
  const auth = Buffer.from(`${need("MPESA_CONSUMER_KEY")}:${need("MPESA_CONSUMER_SECRET")}`).toString("base64");
  const res = await fetch(`${mpesaBase()}/oauth/v1/generate?grant_type=client_credentials`, { headers: { Authorization: `Basic ${auth}` }, cache: "no-store" });
  const j = (await res.json().catch(() => ({}))) as { access_token?: string };
  if (!res.ok || !j.access_token) throw new ApiError(502, "Could not reach M-Pesa. Please try again.");
  return j.access_token;
}
/** yyyyMMddHHmmss in East Africa Time (UTC+3). */
export const timestamp = () => new Date(Date.now() + 3 * 3600_000).toISOString().replace(/[-:T]/g, "").slice(0, 14);

type Tx = FirebaseFirestore.Transaction;
/** Grants what was paid for. Runs inside a transaction: all reads precede writes. */
export async function fulfil(tx: Tx, p: { id: string; userId: string; purpose: Purpose; propertyId?: string; amount: number }, receipt: string | undefined, boostHours: number) {
  const db = adminDb();
  const now = Date.now();
  let propRef: FirebaseFirestore.DocumentReference | undefined;
  let propSnap: FirebaseFirestore.DocumentSnapshot | undefined;
  if (p.purpose === "boost" && p.propertyId) { propRef = db.doc(`properties/${p.propertyId}`); propSnap = await tx.get(propRef); }
  if (p.purpose === "contact-access" && p.propertyId) {
    tx.set(db.doc(`contactUnlocks/${p.userId}_${p.propertyId}`), { userId: p.userId, propertyId: p.propertyId, paymentId: p.id, createdAt: FieldValue.serverTimestamp() });
    tx.update(db.doc(`properties/${p.propertyId}`), { "stats.unlocks": FieldValue.increment(1) });
  } else if (p.purpose === "landlord-registration") {
    tx.set(db.doc(`users/${p.userId}`), { registrationFeePaid: true, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  } else if (p.purpose === "boost" && propRef && propSnap?.exists) {
    const startsAt = Math.max(Number(propSnap.data()?.boostedUntil ?? 0), now);
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
