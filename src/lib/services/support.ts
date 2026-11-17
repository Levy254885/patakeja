"use client";
import { addDoc, arrayUnion, collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { getDb } from "../firebase/client";
import { clean, fromSnaps } from "../firebase/convert";
import type { ListingReport, SupportTicket } from "../types";

export async function createTicket(t: Pick<SupportTicket, "userId" | "userName" | "userEmail" | "subject" | "message" | "category">): Promise<string> {
  const ref = await addDoc(collection(getDb(), "supportTickets"), { ...t, status: "open", replies: [], createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
}
export async function getMyTickets(uid: string): Promise<SupportTicket[]> {
  const s = await getDocs(query(collection(getDb(), "supportTickets"), where("userId", "==", uid), orderBy("createdAt", "desc")));
  return fromSnaps<SupportTicket>(s.docs);
}
export async function replyToTicket(id: string, name: string, message: string, by: "user" | "staff" = "user") {
  await updateDoc(doc(getDb(), "supportTickets", id), { replies: arrayUnion({ by, name, message, at: Date.now() }), status: by === "user" ? "open" : "pending", updatedAt: serverTimestamp() });
}

export async function createReport(r: Pick<ListingReport, "propertyId" | "propertyTitle" | "reason" | "details" | "reporterId">) {
  await addDoc(collection(getDb(), "reports"), clean({ ...r, status: "open", createdAt: serverTimestamp() }));
}
