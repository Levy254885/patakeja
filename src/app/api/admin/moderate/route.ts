import { FieldValue, adminDb } from "@/lib/server/admin-sdk";
import { ApiError, audit, body, notify, ok, requireAdmin, run } from "@/lib/server/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Args { type: "property" | "verification"; id: string; action: "approve" | "reject" | "archive"; reason?: string }

/** Listing and verification moderation. Updates the document, notifies the owner and writes the audit log. */
export async function POST(req: Request) {
  return run(async () => {
    const actor = await requireAdmin(req);
    const { type, id, action, reason } = await body<Args>(req);
    if (!id || id.includes("/")) throw new ApiError(400, "Missing id.");
    const db = adminDb();

    if (type === "property") {
      const ref = db.doc(`properties/${id}`);
      const snap = await ref.get();
      const p = snap.data();
      if (!p) throw new ApiError(404, "Listing not found.");
      const status = action === "approve" ? "published" : action === "reject" ? "rejected" : "archived";
      if (action === "reject" && !String(reason ?? "").trim()) throw new ApiError(400, "Give the owner a reason.");
      await ref.update({
        status, updatedAt: FieldValue.serverTimestamp(),
        ...(action === "approve" ? { rejectionReason: "", publishedAt: FieldValue.serverTimestamp() } : {}),
        ...(action === "reject" ? { rejectionReason: String(reason).trim() } : {}),
      });
      if (action === "approve") await notify(p.ownerId, { type: "listing", title: "Listing approved", body: `${p.title} is now live.`, link: `/property/${p.slug ?? id}` });
      if (action === "reject") await notify(p.ownerId, { type: "listing", title: "Listing needs changes", body: `${p.title}: ${String(reason).trim()}`, link: "/portal/properties" });
      const n = (await db.collection("properties").where("ownerId", "==", p.ownerId).where("status", "==", "published").count().get()).data().count;
      await db.doc(`publicProfiles/${p.ownerId}`).update({ listingCount: n }).catch(() => undefined);
      await audit({ actorId: actor.uid, actorEmail: actor.email, action: `property.${action}`, targetType: "property", targetId: id, summary: `${p.title}: ${p.status} -> ${status}`, before: { status: p.status }, after: { status, reason: reason ?? null } });
      return ok();
    }

    if (type === "verification") {
      if (action === "archive") throw new ApiError(400, "Invalid action.");
      const ref = db.doc(`verificationRequests/${id}`);
      const r = (await ref.get()).data();
      if (!r) throw new ApiError(404, "Request not found.");
      const approved = action === "approve";
      const batch = db.batch();
      batch.update(ref, { status: approved ? "approved" : "rejected", reviewNote: String(reason ?? "").trim() || FieldValue.delete(), reviewedBy: actor.uid, updatedAt: FieldValue.serverTimestamp() });
      if (r.kind === "property") {
        if (r.propertyId) batch.update(db.doc(`properties/${r.propertyId}`), { verified: approved, updatedAt: FieldValue.serverTimestamp() });
      } else {
        batch.update(db.doc(`users/${r.userId}`), { verification: approved ? "verified" : "rejected", updatedAt: FieldValue.serverTimestamp() });
      }
      await batch.commit();
      if (r.kind !== "property") await db.doc(`publicProfiles/${r.userId}`).update({ verified: approved }).catch(() => undefined);
      await notify(r.userId, { type: "verification", title: `Verification ${approved ? "approved" : "rejected"}`, body: String(reason ?? "").trim() || `Your ${r.kind} verification was ${approved ? "approved" : "rejected"}.`, link: "/portal/verification" });
      await audit({ actorId: actor.uid, actorEmail: actor.email, action: `verification.${approved ? "approved" : "rejected"}`, targetType: "verificationRequest", targetId: id, summary: `${r.userName}: ${r.kind} ${approved ? "approved" : "rejected"}`, after: { status: approved ? "approved" : "rejected" } });
      return ok();
    }
    throw new ApiError(400, "Unknown moderation type.");
  });
}
