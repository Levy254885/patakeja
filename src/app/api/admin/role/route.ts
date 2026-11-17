import { FieldValue, adminAuth, adminDb } from "@/lib/server/admin-sdk";
import { ApiError, ROLES, audit, body, ok, requireUser, run } from "@/lib/server/api";
import type { Role } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return run(async () => {
    const actor = await requireUser(req);
    if (actor.role !== "superAdmin") throw new ApiError(403, "Only a super admin can change roles.");
    const { uid, role } = await body<{ uid: string; role: Role }>(req);
    if (!uid || !ROLES.includes(role)) throw new ApiError(400, "uid and a valid role are required.");
    const db = adminDb();
    const ref = db.doc(`users/${uid}`);
    const snap = await ref.get();
    if (!snap.exists) throw new ApiError(404, "User not found.");
    const before = snap.data()!.role as Role;
    if (before === role) return ok();
    if (before === "superAdmin") {
      const n = (await db.collection("users").where("role", "==", "superAdmin").count().get()).data().count;
      if (n <= 1) throw new ApiError(400, "Cannot demote the last super admin.");
    }
    await adminAuth().setCustomUserClaims(uid, { role });
    await ref.update({ role, updatedAt: FieldValue.serverTimestamp() });
    await db.doc(`publicProfiles/${uid}`).update({ role }).catch(() => undefined);
    await audit({ actorId: actor.uid, actorEmail: actor.email, action: "user.role", targetType: "user", targetId: uid, summary: `Role ${before} -> ${role}`, before: { role: before }, after: { role } });
    return ok();
  });
}
