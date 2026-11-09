"use client";
import { collection, doc, getDocs, limit, orderBy, query, updateDoc, where, writeBatch } from "firebase/firestore";
import { getDb } from "../firebase/client";
import { fromSnaps } from "../firebase/convert";
import type { AppNotification } from "../types";

/** Notifications are created server-side (Cloud Function triggers). Clients can only read their own and mark them read. */
export async function getNotifications(uid: string, n = 50): Promise<AppNotification[]> {
  const s = await getDocs(query(collection(getDb(), "notifications"), where("userId", "==", uid), orderBy("createdAt", "desc"), limit(n)));
  return fromSnaps<AppNotification>(s.docs);
}
export const markNotificationRead = (id: string) => updateDoc(doc(getDb(), "notifications", id), { read: true });
export async function markAllNotificationsRead(uid: string) {
  const s = await getDocs(query(collection(getDb(), "notifications"), where("userId", "==", uid), where("read", "==", false)));
  const batch = writeBatch(getDb());
  s.docs.forEach((d) => batch.update(d.ref, { read: true }));
  await batch.commit();
}
export async function countUnread(uid: string): Promise<number> {
  const s = await getDocs(query(collection(getDb(), "notifications"), where("userId", "==", uid), where("read", "==", false), limit(100)));
  return s.size;
}
