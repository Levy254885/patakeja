#!/usr/bin/env node
// Promotes an existing Firebase Auth user to superAdmin (custom claim + users doc + audit log).
// Usage:  node bootstrap-super-admin.mjs --project <id> --email you@example.com
// The user must already have registered on the site. They must sign out and in again (or refresh the token) afterwards.
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
const projectId = opt("project") || process.env.GCLOUD_PROJECT;
const email = opt("email");
if (!projectId || !email) { console.error("Usage: node bootstrap-super-admin.mjs --project <id> --email <email>"); process.exit(1); }

initializeApp({ projectId });
const user = await getAuth().getUserByEmail(email).catch(() => null);
if (!user) { console.error(`No Auth user with email ${email}. Register on the site first.`); process.exit(1); }
const db = getFirestore();
await getAuth().setCustomUserClaims(user.uid, { role: "superAdmin" });
await db.doc(`users/${user.uid}`).set({ uid: user.uid, email: user.email, role: "superAdmin", fullName: user.displayName || "Super Admin", phone: "", updatedAt: FieldValue.serverTimestamp() }, { merge: true });
await db.collection("auditLogs").add({ actorId: "bootstrap-script", actorEmail: "", action: "user.role", targetType: "user", targetId: user.uid, summary: `Bootstrap: ${email} -> superAdmin`, after: { role: "superAdmin" }, createdAt: FieldValue.serverTimestamp() });
console.log(`${email} (${user.uid}) is now superAdmin. Sign out and back in to pick up the new claim.`);
