"use client";
import { addDoc, collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { callFunction, getDb } from "../firebase/client";
import { clean, fromSnaps, newestFirst } from "../firebase/convert";
import type { AppointmentStatus, Inquiry, InquiryStatus, ViewingAppointment } from "../types";

type NewInquiry = Pick<Inquiry, "propertyId" | "propertyTitle" | "ownerId" | "name" | "phone" | "email" | "message"> & { customerId?: string };
type NewViewing = Pick<ViewingAppointment, "propertyId" | "propertyTitle" | "ownerId" | "name" | "phone" | "email" | "preferredDate" | "preferredTime" | "message"> & { customerId?: string };

export async function createInquiry(i: NewInquiry): Promise<string> {
  const ref = await addDoc(collection(getDb(), "inquiries"), clean({ ...i, status: "new", createdAt: serverTimestamp() }));
  callFunction("events", { type: "inquiry-created", id: ref.id }).catch(() => undefined);
  return ref.id;
}

export async function createViewing(v: NewViewing): Promise<string> {
  const ref = await addDoc(collection(getDb(), "viewingAppointments"), clean({ ...v, status: "pending", createdAt: serverTimestamp() }));
  callFunction("events", { type: "viewing-created", id: ref.id }).catch(() => undefined);
  return ref.id;
}

// Owner (landlord / agent) side
export async function getInquiriesForOwner(ownerId: string): Promise<Inquiry[]> {
  const s = await getDocs(query(collection(getDb(), "inquiries"), where("ownerId", "==", ownerId)));
  return newestFirst(fromSnaps<Inquiry>(s.docs));
}
export async function getViewingsForOwner(ownerId: string): Promise<ViewingAppointment[]> {
  const s = await getDocs(query(collection(getDb(), "viewingAppointments"), where("ownerId", "==", ownerId)));
  return newestFirst(fromSnaps<ViewingAppointment>(s.docs));
}
export const setInquiryStatus = (id: string, status: InquiryStatus) => updateDoc(doc(getDb(), "inquiries", id), { status });
export const setViewingStatus = async (id: string, status: AppointmentStatus) => {
  await updateDoc(doc(getDb(), "viewingAppointments", id), { status });
  callFunction("events", { type: "viewing-updated", id }).catch(() => undefined); // tells the customer
};

// Customer side
export async function getInquiriesForCustomer(uid: string): Promise<Inquiry[]> {
  const s = await getDocs(query(collection(getDb(), "inquiries"), where("customerId", "==", uid)));
  return newestFirst(fromSnaps<Inquiry>(s.docs));
}
export async function getViewingsForCustomer(uid: string): Promise<ViewingAppointment[]> {
  const s = await getDocs(query(collection(getDb(), "viewingAppointments"), where("customerId", "==", uid)));
  return newestFirst(fromSnaps<ViewingAppointment>(s.docs));
}
export const cancelViewing = (id: string) => setViewingStatus(id, "cancelled");
