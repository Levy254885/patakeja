"use client";
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";

/** Vercel values are sometimes pasted with spaces, newlines or quotes; these silently break Firebase requests. */
const env = (v?: string) => v?.trim().replace(/^['"]|['"]$/g, "").trim() || undefined;

const config = {
  apiKey: env(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: env(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: env(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: env(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: env(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: env(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
  measurementId: env(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID),
};

/** True when the Firebase web config is present. Pages show a clear setup message when it is not. */
export const isFirebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let emulatorsConnected = false;

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured) throw new Error("Firebase is not configured. Set the NEXT_PUBLIC_FIREBASE_* variables (see .env.example).");
  if (!app) app = getApps().length ? getApp() : initializeApp(config);
  return app;
}

function connectEmulatorsOnce() {
  if (emulatorsConnected || process.env.NEXT_PUBLIC_USE_EMULATORS !== "true") return;
  emulatorsConnected = true;
  connectAuthEmulator(getAuthClient(), "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(getDb(), "127.0.0.1", 8080);
}

export function getAuthClient(): Auth {
  if (!auth) auth = getAuth(getFirebaseApp());
  return auth;
}
export function getDb(): Firestore {
  if (!db) db = getFirestore(getFirebaseApp());
  return db;
}

/** Call once at app start (AuthProvider does this). */
export function initFirebase() {
  getFirebaseApp();
  connectEmulatorsOnce();
}

const ROUTES: Record<string, string> = {
  getCloudinarySignature: "/api/cloudinary/sign",
  deleteCloudinaryAsset: "/api/cloudinary/delete",
  initiateMpesaPayment: "/api/payments/initiate",
  trackPropertyView: "/api/views",
  setUserRole: "/api/admin/role",
  updatePricing: "/api/admin/pricing",
  broadcastNotification: "/api/admin/broadcast",
  moderate: "/api/admin/moderate",
  events: "/api/events",
  authSync: "/api/auth/sync",
};

/** Calls a server API route (Next.js on Vercel) with the signed-in user's Firebase ID token. */
export async function callFunction<Req, Res>(name: string, data: Req): Promise<Res> {
  const route = ROUTES[name];
  if (!route) throw new Error(`Unknown server action: ${name}`);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const user = getAuthClient().currentUser;
  if (user) headers.Authorization = `Bearer ${await user.getIdToken()}`;
  const res = await fetch(route, { method: "POST", headers, body: JSON.stringify(data ?? {}) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message || "Request failed. Please try again.");
  return json as Res;
}

export const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "https://www.patakeja.co.ke";
