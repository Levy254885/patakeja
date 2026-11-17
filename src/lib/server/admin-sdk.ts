// Server-only. Firebase Admin SDK, configured from Vercel environment variables (no Firebase CLI or Cloud Functions needed).
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

export { FieldValue };

function init() {
  if (getApps().length) return;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n").replace(/^"|"$/g, "");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Server is not configured: set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in Vercel.");
  }
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

export const adminDb = () => { init(); return getFirestore(); };
export const adminAuth = () => { init(); return getAuth(); };
