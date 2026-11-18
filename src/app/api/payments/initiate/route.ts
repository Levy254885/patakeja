import { FieldValue, adminDb } from "@/lib/server/admin-sdk";
import { ApiError, body, getPricingAdmin, ok, requireUser, run } from "@/lib/server/api";
import { PURPOSES, accessToken, fulfil, mpesaBase, need, normalisePhone, timestamp, type Purpose } from "@/lib/server/mpesa-server";
import { effectivePrice } from "@/lib/pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Starts an M-Pesa STK push. The amount is ALWAYS read here from siteSettings/pricing; the browser never sends a price. */
export async function POST(req: Request) {
  return run(async () => {
    const caller = await requireUser(req);
    const uid = caller.uid;
    const d = await body<{ purpose: Purpose; propertyId?: string; phone: string }>(req);
    const purpose = d.purpose;
    const propertyId = d.propertyId ? String(d.propertyId) : undefined;
    if (!PURPOSES.includes(purpose)) throw new ApiError(400, "Unknown payment purpose.");
    const phone = normalisePhone(d.phone);
    if (!phone) throw new ApiError(400, "Enter a valid Safaricom number, e.g. 0712 345 678.");

    const db = adminDb();
    const user = (await db.doc(`users/${uid}`).get()).data();
    if (!user || user.disabled) throw new ApiError(403, "Account unavailable.");
    const pricing = await getPricingAdmin();
    let title: string | undefined;
    let item = pricing.contactAccess;

    if (purpose === "landlord-registration") {
      if (!["landlord", "agent"].includes(user.role)) throw new ApiError(400, "Only landlords and agents pay the registration fee.");
      if (user.registrationFeePaid) return ok({ paymentId: "", amount: 0, message: "Registration is already paid." });
      item = pricing.landlordRegistration;
    } else {
      if (!propertyId || propertyId.includes("/")) throw new ApiError(400, "propertyId is required.");
      const prop = await db.doc(`properties/${propertyId}`).get();
      if (!prop.exists) throw new ApiError(404, "Property not found.");
      const pd = prop.data()!;
      title = pd.title;
      if (purpose === "contact-access") {
        if (pd.status !== "published") throw new ApiError(400, "This listing is not available.");
        if (pd.ownerId === uid) throw new ApiError(400, "This is your own listing.");
        if ((await db.doc(`contactUnlocks/${uid}_${propertyId}`).get()).exists) return ok({ paymentId: "", amount: 0, message: "You already have access to these contact details." });
      } else {
        if (pd.ownerId !== uid) throw new ApiError(403, "You can only boost your own listings.");
        if (pd.status !== "published") throw new ApiError(400, "Only published listings can be boosted.");
        item = pricing.boost;
      }
    }
    const amount = effectivePrice(item);
    const hours = purpose === "boost" ? pricing.boost.durationHours || 24 : 0;

    // Free (disabled or KES 0 promo): fulfil immediately, still leaving a ledger row.
    if (amount <= 0) {
      const ref = db.collection("payments").doc();
      await db.runTransaction(async (tx) => {
        await fulfil(tx, { id: ref.id, userId: uid, purpose, propertyId, amount: 0 }, undefined, hours);
        tx.set(ref, { userId: uid, purpose, propertyId: propertyId ?? null, propertyTitle: title ?? null, amount: 0, phone, status: "success", resultDesc: "No charge", createdAt: FieldValue.serverTimestamp(), completedAt: FieldValue.serverTimestamp() });
      });
      return ok({ paymentId: ref.id, amount: 0, message: "Done. No charge applied." });
    }

    // Idempotency: reuse a pending request for the same thing made in the last 2 minutes.
    const recent = await db.collection("payments").where("userId", "==", uid).where("status", "==", "pending").get();
    const dup = recent.docs.find((x) => x.data().purpose === purpose && (x.data().propertyId ?? undefined) === propertyId && Date.now() - (x.data().createdAtMs ?? 0) < 120_000);
    if (dup) return ok({ paymentId: dup.id, amount: dup.data().amount, message: "A payment prompt was already sent. Check your phone." });

    const shortcode = need("MPESA_SHORTCODE");
    const ts = timestamp();
    const password = Buffer.from(`${shortcode}${need("MPESA_PASSKEY")}${ts}`).toString("base64");
    const site = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
    if (!site) throw new ApiError(503, "NEXT_PUBLIC_SITE_URL is not set.");
    const callback = `${site}/api/mpesa/callback?token=${encodeURIComponent(need("MPESA_CALLBACK_TOKEN"))}`;
    const token = await accessToken();
    const res = await fetch(`${mpesaBase()}/mpesa/stkpush/v1/processrequest`, {
      method: "POST", cache: "no-store",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        BusinessShortCode: shortcode, Password: password, Timestamp: ts,
        TransactionType: process.env.MPESA_TRANSACTION_TYPE || "CustomerPayBillOnline",
        Amount: amount, PartyA: phone, PartyB: shortcode, PhoneNumber: phone, CallBackURL: callback,
        AccountReference: "PataKeja", TransactionDesc: purpose.slice(0, 20),
      }),
    });
    const j = (await res.json().catch(() => ({}))) as { ResponseCode?: string; CheckoutRequestID?: string; MerchantRequestID?: string; errorMessage?: string; CustomerMessage?: string };
    if (!res.ok || j.ResponseCode !== "0" || !j.CheckoutRequestID) throw new ApiError(502, j.errorMessage || "M-Pesa did not accept the request. Please try again.");

    await db.doc(`payments/${j.CheckoutRequestID}`).set({
      userId: uid, purpose, propertyId: propertyId ?? null, propertyTitle: title ?? null, amount, phone, status: "pending",
      merchantRequestId: j.MerchantRequestID ?? null, createdAt: FieldValue.serverTimestamp(), createdAtMs: Date.now(), boostHours: hours,
    });
    return ok({ paymentId: j.CheckoutRequestID, amount, message: j.CustomerMessage || "Check your phone and enter your M-Pesa PIN." });
  });
}
