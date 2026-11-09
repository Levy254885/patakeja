"use client";
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { callFunction, getDb } from "../firebase/client";
import { fromSnap, fromSnaps } from "../firebase/convert";
import type { ContactUnlock, Payment, PaymentPurpose, PropertyContact } from "../types";

export interface StartPaymentArgs {
  purpose: PaymentPurpose;
  propertyId?: string; // required for contact-access and boost
  phone: string; // M-Pesa number that will receive the STK push
}
export interface StartPaymentResult {
  paymentId: string; // payments/{id}; id is Daraja's CheckoutRequestID
  amount: number;
  message: string;
}

/**
 * Starts an M-Pesa STK push. The amount is decided on the server from siteSettings/pricing; the browser never sends a price.
 * If the charge is disabled by an admin, the function responds with amount 0 and unlocks immediately.
 */
export const startPayment = (a: StartPaymentArgs) => callFunction<StartPaymentArgs, StartPaymentResult>("initiateMpesaPayment", a);

export async function getPayment(id: string): Promise<Payment | null> {
  return fromSnap<Payment>(await getDoc(doc(getDb(), "payments", id)));
}

/** Poll a payment until it leaves "pending" (user approves or declines on their phone). */
export async function waitForPayment(id: string, opts: { intervalMs?: number; timeoutMs?: number; signal?: AbortSignal } = {}): Promise<Payment> {
  const { intervalMs = 3000, timeoutMs = 120000, signal } = opts;
  const start = Date.now();
  for (;;) {
    if (signal?.aborted) throw new Error("Cancelled");
    const p = await getPayment(id);
    if (p && p.status !== "pending") return p;
    if (Date.now() - start > timeoutMs) throw new Error("We have not received the M-Pesa confirmation yet. If money was deducted, it will appear in your payments shortly.");
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

export async function getMyPayments(uid: string): Promise<Payment[]> {
  const s = await getDocs(query(collection(getDb(), "payments"), where("userId", "==", uid), orderBy("createdAt", "desc"), limit(100)));
  return fromSnaps<Payment>(s.docs);
}

export async function getMyUnlocks(uid: string): Promise<ContactUnlock[]> {
  const s = await getDocs(query(collection(getDb(), "contactUnlocks"), where("userId", "==", uid), orderBy("createdAt", "desc")));
  return fromSnaps<ContactUnlock>(s.docs);
}

export async function hasUnlocked(uid: string, propertyId: string): Promise<boolean> {
  return (await getDoc(doc(getDb(), "contactUnlocks", `${uid}_${propertyId}`))).exists();
}

/** Returns the private contact, or null when Firestore rules deny it (not paid yet / not signed in). */
export async function getPrivateContact(propertyId: string): Promise<PropertyContact | null> {
  try {
    const snap = await getDoc(doc(getDb(), "properties", propertyId, "private", "contact"));
    return snap.exists() ? (snap.data() as PropertyContact) : null;
  } catch {
    return null;
  }
}
