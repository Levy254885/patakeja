import { FieldValue, adminDb } from "@/lib/server/admin-sdk";
import { ApiError, audit, body, ok, requireAdmin, run } from "@/lib/server/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  return run(async () => {
    const actor = await requireAdmin(req);
    const d = await body<{ title: string; body: string; audience: string }>(req);
    const title = String(d.title ?? "").trim(), text = String(d.body ?? "").trim(), audience = String(d.audience ?? "all");
    if (!title || title.length > 120 || !text || text.length > 1000) throw new ApiError(400, "Title (max 120) and body (max 1000) are required.");
    if (!["all", "customer", "landlord", "agent", "admin"].includes(audience)) throw new ApiError(400, "Unknown audience.");
    const db = adminDb();
    let q: FirebaseFirestore.Query = db.collection("users");
    if (audience === "admin") q = q.where("role", "in", ["admin", "superAdmin"]);
    else if (audience !== "all") q = q.where("role", "==", audience);
    const writer = db.bulkWriter();
    let sent = 0;
    let last: FirebaseFirestore.QueryDocumentSnapshot | undefined;
    for (;;) {
      const page = await (last ? q.orderBy("__name__").startAfter(last) : q.orderBy("__name__")).limit(500).get();
      if (page.empty) break;
      for (const u of page.docs) {
        if (u.data().disabled) continue;
        writer.create(db.collection("notifications").doc(), { userId: u.id, type: "system", title, body: text, read: false, createdAt: FieldValue.serverTimestamp() });
        sent++;
      }
      last = page.docs[page.docs.length - 1];
    }
    await writer.close();
    await audit({ actorId: actor.uid, actorEmail: actor.email, action: "notification.broadcast", targetType: "notification", summary: `Broadcast to ${audience} (${sent})`, after: { title, audience, sent } });
    return ok({ ok: true, sent });
  });
}
