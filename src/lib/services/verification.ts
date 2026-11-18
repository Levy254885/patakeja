"use client";
import { addDoc, collection, getDocs, orderBy, query, serverTimestamp, where } from "firebase/firestore";
import { getDb } from "../firebase/client";
import { clean, fromSnaps, newestFirst } from "../firebase/convert";
import type { VerificationRequest } from "../types";

export async function createVerificationRequest(r: Pick<VerificationRequest, "userId" | "userName" | "kind" | "propertyId" | "note" | "documents">) {
  const ref = await addDoc(collection(getDb(), "verificationRequests"), clean({ ...r, status: "pending", createdAt: serverTimestamp() }));
  return ref.id;
}
export async function getMyVerificationRequests(uid: string): Promise<VerificationRequest[]> {
  const s = await getDocs(query(collection(getDb(), "verificationRequests"), where("userId", "==", uid)));
  return newestFirst(fromSnaps<VerificationRequest>(s.docs));
}
