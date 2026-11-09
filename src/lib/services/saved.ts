"use client";
import { collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { getDb } from "../firebase/client";
import { fromSnaps } from "../firebase/convert";
import { fetchPropertiesByIds } from "./properties";
import type { Property, SavedProperty } from "../types";

const savedId = (uid: string, propertyId: string) => `${uid}_${propertyId}`;

export async function getSavedIds(uid: string): Promise<string[]> {
  const snap = await getDocs(query(collection(getDb(), "savedProperties"), where("userId", "==", uid)));
  return snap.docs.map((d) => (d.data() as SavedProperty).propertyId);
}

/** Toggle and return the new saved state. */
export async function toggleSaved(uid: string, propertyId: string): Promise<boolean> {
  const ref = doc(getDb(), "savedProperties", savedId(uid, propertyId));
  if ((await getDoc(ref)).exists()) {
    await deleteDoc(ref);
    return false;
  }
  await setDoc(ref, { userId: uid, propertyId, createdAt: serverTimestamp() });
  return true;
}

export async function getSavedProperties(uid: string): Promise<Property[]> {
  const snap = await getDocs(query(collection(getDb(), "savedProperties"), where("userId", "==", uid), orderBy("createdAt", "desc")));
  const rows = fromSnaps<SavedProperty>(snap.docs);
  return fetchPropertiesByIds(rows.map((r) => r.propertyId));
}

export async function recordRecentlyViewed(uid: string, propertyId: string) {
  await setDoc(doc(getDb(), "users", uid, "recentlyViewed", propertyId), { propertyId, viewedAt: serverTimestamp() });
}

export async function getRecentlyViewed(uid: string, n = 12): Promise<Property[]> {
  const snap = await getDocs(query(collection(getDb(), "users", uid, "recentlyViewed"), orderBy("viewedAt", "desc"), limit(n)));
  return fetchPropertiesByIds(snap.docs.map((d) => (d.data() as { propertyId: string }).propertyId));
}
