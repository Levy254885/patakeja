import { createHash } from "node:crypto";
import { FieldValue, adminDb } from "@/lib/server/admin-sdk";
import { ApiError, body, getCaller, ok, run } from "@/lib/server/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Counts a listing view once per visitor per day (marker doc in viewDedupe; add a Firestore TTL policy on expireAt to auto-clean). */
export async function POST(req: Request) {
  return run(async () => {
    const propertyId = String((await body<{ propertyId: string }>(req)).propertyId ?? "");
    if (!propertyId || propertyId.includes("/")) throw new ApiError(400, "propertyId required.");
    const caller = await getCaller(req);
    const ip = req.headers.get("x-forwarded-for") ?? "";
    const visitor = caller?.uid ?? createHash("sha256").update(ip + (req.headers.get("user-agent") ?? "")).digest("hex").slice(0, 24);
    const db = adminDb();
    const prop = await db.doc(`properties/${propertyId}`).get();
    if (!prop.exists || prop.data()!.status !== "published" || prop.data()!.ownerId === caller?.uid) return ok();
    try {
      await db.doc(`viewDedupe/${propertyId}_${visitor}_${new Date().toISOString().slice(0, 10)}`).create({ propertyId, expireAt: new Date(Date.now() + 2 * 86400_000) });
    } catch { return ok(); }
    await prop.ref.update({ "stats.views": FieldValue.increment(1) });
    return ok();
  });
}
