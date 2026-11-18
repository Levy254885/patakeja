import { FieldValue, adminDb } from "@/lib/server/admin-sdk";
import { ApiError, audit, body, getPricingAdmin, ok, requireAdmin, run } from "@/lib/server/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const num = (v: unknown, name: string, max = 1_000_000) => {
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > max) throw new ApiError(400, `${name} must be a number between 0 and ${max}.`);
  return Math.round(v);
};
function cleanItem(v: any, name: string, extra = false) {
  if (!v || typeof v !== "object") throw new ApiError(400, `${name} is missing.`);
  const o: Record<string, unknown> = { amount: num(v.amount, `${name} amount`), enabled: v.enabled === true };
  if (v.promoAmount != null) {
    o.promoAmount = num(v.promoAmount, `${name} promo amount`);
    if ((o.promoAmount as number) > (o.amount as number)) throw new ApiError(400, `${name} promo must not exceed the normal price.`);
    if (v.promoEndsAt != null) o.promoEndsAt = num(v.promoEndsAt, `${name} promo end`, 8.64e15);
  }
  if (extra) o.durationHours = Math.max(1, num(v.durationHours, `${name} duration`, 24 * 30));
  return o;
}

export async function POST(req: Request) {
  return run(async () => {
    const actor = await requireAdmin(req);
    const d = await body(req);
    const next = {
      landlordRegistration: cleanItem(d.landlordRegistration, "Landlord registration"),
      contactAccess: cleanItem(d.contactAccess, "Contact access"),
      boost: cleanItem(d.boost, "Boost", true),
    };
    const before = await getPricingAdmin();
    await adminDb().doc("siteSettings/pricing").set({ ...next, updatedAt: FieldValue.serverTimestamp(), updatedBy: actor.uid });
    await audit({ actorId: actor.uid, actorEmail: actor.email, action: "pricing.update", targetType: "siteSettings", targetId: "pricing", summary: "Pricing updated", before, after: next });
    return ok();
  });
}
