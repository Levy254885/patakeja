import { FieldValue, adminAuth, adminDb } from "@/lib/server/admin-sdk";
import { ok, requireUser, run, superAdminEmails } from "@/lib/server/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * First-admin bootstrap with no CLI: if the signed-in user's VERIFIED email is listed in SUPER_ADMIN_EMAILS (Vercel),
 * they become super admin. Returns { changed: true } so the browser refreshes its token.
 */
export async function POST(req: Request) {
  return run(async () => {
    const user = await requireUser(req);
    const email = user.email?.toLowerCase();
    if (!email || !user.emailVerified || !superAdminEmails().includes(email) || user.role === "superAdmin") return ok({ changed: false });
    await adminAuth().setCustomUserClaims(user.uid, { role: "superAdmin" });
    await adminDb().doc(`users/${user.uid}`).set({ role: "superAdmin", updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return ok({ changed: true });
  });
}
