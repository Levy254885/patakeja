import { onDocumentCreated, onDocumentDeleted, onDocumentUpdatedWithAuthContext } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { FieldValue, REGION, audit, db, notify } from "./common";

const opts = { region: REGION };
const bump = (propertyId: string, field: "enquiries" | "unlocks" | "saves", by = 1) =>
  db.doc(`properties/${propertyId}`).update({ [`stats.${field}`]: FieldValue.increment(by) }).catch(() => undefined);

export const onInquiryCreated = onDocumentCreated({ ...opts, document: "inquiries/{id}" }, async (e) => {
  const d = e.data?.data(); if (!d) return;
  await notify(d.ownerId, { type: "inquiry", title: "New enquiry", body: `${d.name} asked about ${d.propertyTitle}.`, link: "/portal/enquiries" });
  await bump(d.propertyId, "enquiries");
});
export const onViewingCreated = onDocumentCreated({ ...opts, document: "viewingAppointments/{id}" }, async (e) => {
  const d = e.data?.data(); if (!d) return;
  await notify(d.ownerId, { type: "viewing", title: "New viewing request", body: `${d.name} requested a viewing of ${d.propertyTitle} on ${d.preferredDate} at ${d.preferredTime}.`, link: "/portal/viewings" });
});
export const onViewingUpdated = onDocumentUpdatedWithAuthContext({ ...opts, document: "viewingAppointments/{id}" }, async (e) => {
  const b = e.data?.before.data(), a = e.data?.after.data();
  if (!a || !b || a.status === b.status || !a.customerId || a.status === "cancelled") return;
  await notify(a.customerId, { type: "viewing", title: `Viewing ${a.status}`, body: `Your viewing request for ${a.propertyTitle} is now ${a.status}.`, link: "/account/viewings" });
});
export const onSavedCreated = onDocumentCreated({ ...opts, document: "savedProperties/{id}" }, async (e) => {
  const d = e.data?.data(); if (d) await bump(d.propertyId, "saves", 1);
});
export const onSavedDeleted = onDocumentDeleted({ ...opts, document: "savedProperties/{id}" }, async (e) => {
  const d = e.data?.data(); if (d) await bump(d.propertyId, "saves", -1);
});
export const onUnlockCreated = onDocumentCreated({ ...opts, document: "contactUnlocks/{id}" }, async (e) => {
  const d = e.data?.data(); if (d) await bump(d.propertyId, "unlocks");
});

async function syncListingCount(ownerId: string) {
  const n = (await db.collection("properties").where("ownerId", "==", ownerId).where("status", "==", "published").count().get()).data().count;
  await db.doc(`publicProfiles/${ownerId}`).update({ listingCount: n }).catch(() => undefined);
}

/** Listing moderation: notify owner, audit with the acting user (auth-context trigger), keep listing counts right. */
export const onPropertyUpdated = onDocumentUpdatedWithAuthContext({ ...opts, document: "properties/{id}" }, async (e) => {
  const b = e.data?.before.data(), a = e.data?.after.data();
  if (!a || !b || a.status === b.status) return; // ignores counter-only updates, so no trigger loops
  const id = e.params.id;
  await syncListingCount(a.ownerId);
  const byOwner = e.authId === a.ownerId;
  if (a.status === "published" && b.status === "pending")
    await notify(a.ownerId, { type: "listing", title: "Listing approved", body: `${a.title} is now live.`, link: `/property/${a.slug ?? id}` });
  if (a.status === "rejected")
    await notify(a.ownerId, { type: "listing", title: "Listing needs changes", body: `${a.title}: ${a.rejectionReason || "see the reviewer note."}`, link: "/portal/properties" });
  if (!byOwner && e.authId) {
    const action = a.status === "published" ? "property.approve" : a.status === "rejected" ? "property.reject" : `property.${a.status}`;
    await audit({ actorId: e.authId, action, targetType: "property", targetId: id, summary: `${a.title}: ${b.status} -> ${a.status}`, before: { status: b.status }, after: { status: a.status, reason: a.rejectionReason ?? null } });
  }
});

export const onVerificationReviewed = onDocumentUpdatedWithAuthContext({ ...opts, document: "verificationRequests/{id}" }, async (e) => {
  const b = e.data?.before.data(), a = e.data?.after.data();
  if (!a || !b || a.status === b.status || a.status === "pending") return;
  await notify(a.userId, { type: "verification", title: `Verification ${a.status}`, body: a.reviewNote || `Your ${a.kind} verification was ${a.status}.`, link: "/portal/verification" });
  await audit({ actorId: e.authId ?? "unknown", action: `verification.${a.status}`, targetType: "verificationRequest", targetId: e.params.id, summary: `${a.userName}: ${a.kind} ${a.status}`, after: { status: a.status } });
});

export const onGeneralSettingsChanged = onDocumentUpdatedWithAuthContext({ ...opts, document: "siteSettings/{id}" }, async (e) => {
  if (e.params.id === "pricing") return; // audited by the updatePricing callable
  await audit({ actorId: e.authId ?? "unknown", action: "settings.update", targetType: "siteSettings", targetId: e.params.id, summary: `Updated ${e.params.id} settings`, before: e.data?.before.data(), after: e.data?.after.data() });
});

/** Hourly: clear expired boosts and tell the owner. Single-field range query, no composite index needed. */
export const expireBoosts = onSchedule({ region: REGION, schedule: "every 60 minutes" }, async () => {
  const snap = await db.collection("properties").where("boostedUntil", "<=", Date.now()).limit(400).get();
  for (const d of snap.docs) {
    await d.ref.update({ boostedUntil: FieldValue.delete() });
    await notify(d.data().ownerId, { type: "listing", title: "Boost ended", body: `The boost on ${d.data().title} has ended. You can boost it again from your dashboard.`, link: "/portal/boost" });
  }
});
