import { FieldValue, adminDb } from "@/lib/server/admin-sdk";
import { ApiError, body, getCaller, isAdmin, notify, ok, run } from "@/lib/server/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Replaces the old Firestore triggers: the browser calls this right after it writes an enquiry/viewing so the owner
 * is notified and counters stay right. Each document is handled once (a server-set flag makes it idempotent).
 */
export async function POST(req: Request) {
  return run(async () => {
    const { type, id } = await body<{ type: string; id: string }>(req);
    if (!id || String(id).includes("/")) throw new ApiError(400, "Missing id.");
    const db = adminDb();

    if (type === "inquiry-created" || type === "viewing-created") {
      const ref = db.doc(`${type === "inquiry-created" ? "inquiries" : "viewingAppointments"}/${id}`);
      const snap = await ref.get();
      const d = snap.data();
      if (!d || d.notified === true) return ok();
      const created = d.createdAt?.toMillis?.() ?? 0;
      if (Date.now() - created > 15 * 60_000) return ok(); // only fresh documents
      await ref.update({ notified: true });
      if (type === "inquiry-created") {
        await notify(d.ownerId, { type: "inquiry", title: "New enquiry", body: `${d.name} asked about ${d.propertyTitle}.`, link: "/portal/enquiries" });
        await db.doc(`properties/${d.propertyId}`).update({ "stats.enquiries": FieldValue.increment(1) }).catch(() => undefined);
      } else {
        await notify(d.ownerId, { type: "viewing", title: "New viewing request", body: `${d.name} requested a viewing of ${d.propertyTitle} on ${d.preferredDate} at ${d.preferredTime}.`, link: "/portal/viewings" });
      }
      return ok();
    }

    if (type === "viewing-updated") {
      const caller = await getCaller(req);
      if (!caller) throw new ApiError(401, "Please sign in.");
      const ref = db.doc(`viewingAppointments/${id}`);
      const d = (await ref.get()).data();
      if (!d) throw new ApiError(404, "Not found.");
      if (d.ownerId !== caller.uid && !isAdmin(caller)) throw new ApiError(403, "Not allowed.");
      if (!d.customerId || d.status === "pending" || d.status === "cancelled" || d.lastNotifiedStatus === d.status) return ok();
      await ref.update({ lastNotifiedStatus: d.status });
      await notify(d.customerId, { type: "viewing", title: `Viewing ${d.status}`, body: `Your viewing request for ${d.propertyTitle} is now ${d.status}.`, link: "/account/viewings" });
      return ok();
    }
    throw new ApiError(400, "Unknown event.");
  });
}
