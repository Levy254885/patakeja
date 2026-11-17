import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { FieldValue, adminDb } from "@/lib/server/admin-sdk";
import { fulfil } from "@/lib/server/mpesa-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const safeEq = (a: string, b: string) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };

/** Safaricom calls this after the customer approves or declines. Protected by a secret token in the URL; idempotent. */
export async function POST(req: Request) {
  const expected = process.env.MPESA_CALLBACK_TOKEN || "";
  const token = new URL(req.url).searchParams.get("token") ?? "";
  if (!expected || !safeEq(token, expected)) return new NextResponse("Forbidden", { status: 403 });
  const json = (await req.json().catch(() => null)) as any;
  const cb = json?.Body?.stkCallback;
  const id = cb?.CheckoutRequestID as string | undefined;
  if (!id) return new NextResponse("Bad request", { status: 400 });
  const meta: Record<string, unknown> = {};
  for (const it of cb.CallbackMetadata?.Item ?? []) meta[it.Name] = it.Value;
  const db = adminDb();
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
    console.error("mpesa callback failed", id, e);
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Retry" }, { status: 500 });
  }
  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
