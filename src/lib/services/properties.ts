"use client";
import { collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { callFunction, getDb } from "../firebase/client";
import { clean, fromSnap, fromSnaps } from "../firebase/convert";
import { deleteCloudinaryAsset } from "../cloudinary";
import { propertySlug } from "../format";
import type { Amenity, Availability, CloudImage, Furnishing, ListingType, Property, PropertyCategory, PropertyContact, PropertyLocation, PublicLister, UserProfile } from "../types";

export interface PropertyInput {
  title: string;
  description: string;
  listingType: ListingType;
  categoryId: string;
  price: number;
  depositAmount?: number;
  bedrooms?: number;
  bathrooms?: number;
  sizeSqm?: number;
  landSizeAcres?: number;
  furnishing?: Furnishing;
  amenities: string[];
  location: PropertyLocation;
  images: CloudImage[]; // order matters: first = cover
  availability: Availability;
  contact: PropertyContact; // stored in the private subdocument, never on the public property
}

export interface SaveArgs {
  id?: string; // omit to create
  input: PropertyInput;
  owner: UserProfile;
  categories: PropertyCategory[];
  amenities: Amenity[];
  /** From siteSettings/general.requireListingApproval. */
  requireApproval: boolean;
  /** true = submit for review/publish, false = keep as draft. */
  submit: boolean;
  isAdmin?: boolean;
}

const pub = (p: UserProfile): PublicLister => ({
  id: p.uid,
  name: p.fullName,
  role: p.role,
  companyName: p.companyName,
  photoUrl: p.photo?.url,
  verified: p.verification === "verified",
});

/** Create or update a property plus its private contact document. Returns the property id. */
export async function saveProperty(a: SaveArgs): Promise<string> {
  const db = getDb();
  const { input } = a;
  const cat = a.categories.find((c) => c.id === input.categoryId);
  if (!cat) throw new Error("Choose a property category.");
  const ref = a.id ? doc(db, "properties", a.id) : doc(collection(db, "properties"));
  const id = ref.id;
  const amenityNames = a.amenities.filter((x) => input.amenities.includes(x.id)).map((x) => x.name);
  const nextStatus = a.submit ? (a.requireApproval && !a.isAdmin ? "pending" : "published") : "draft";

  const base = {
    title: input.title.trim(),
    slug: propertySlug(input.title, id),
    description: input.description.trim(),
    listingType: input.listingType,
    categoryId: cat.id,
    categoryName: cat.name,
    categoryGroup: cat.group,
    price: input.price,
    depositAmount: input.depositAmount,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    sizeSqm: input.sizeSqm,
    landSizeAcres: input.landSizeAcres,
    furnishing: input.furnishing,
    amenities: input.amenities,
    amenityNames,
    location: input.location,
    images: input.images,
    availability: input.availability,
    status: nextStatus,
    updatedAt: serverTimestamp(),
  };

  if (a.id) {
    await updateDoc(ref, clean({ ...base, ...(nextStatus === "published" ? { publishedAt: serverTimestamp() } : {}) }));
  } else {
    await setDoc(ref, clean({
      ...base,
      ownerId: a.owner.uid,
      owner: pub(a.owner),
      verified: false,
      stats: { views: 0, enquiries: 0, unlocks: 0, saves: 0 },
      createdAt: serverTimestamp(),
      ...(nextStatus === "published" ? { publishedAt: serverTimestamp() } : {}),
    }));
  }
  await setDoc(doc(db, "properties", id, "private", "contact"), clean({ ...input.contact }));
  return id;
}

export async function getProperty(id: string): Promise<Property | null> {
  return fromSnap<Property>(await getDoc(doc(getDb(), "properties", id)));
}

export async function getMyProperties(ownerId: string): Promise<Property[]> {
  const snap = await getDocs(query(collection(getDb(), "properties"), where("ownerId", "==", ownerId), orderBy("createdAt", "desc")));
  return fromSnaps<Property>(snap.docs);
}

/** Owner-side read of the private contact document (for the edit form). */
export async function getMyPropertyContact(id: string): Promise<PropertyContact | null> {
  const snap = await getDoc(doc(getDb(), "properties", id, "private", "contact"));
  return snap.exists() ? (snap.data() as PropertyContact) : null;
}

export async function setAvailability(id: string, availability: Availability) {
  await updateDoc(doc(getDb(), "properties", id), { availability, updatedAt: serverTimestamp() });
}

export async function setPropertyStatus(id: string, status: "draft" | "archived") {
  await updateDoc(doc(getDb(), "properties", id), { status, updatedAt: serverTimestamp() });
}

export async function deleteProperty(p: Pick<Property, "id" | "images">) {
  const db = getDb();
  await deleteDoc(doc(db, "properties", p.id, "private", "contact")).catch(() => undefined);
  await deleteDoc(doc(db, "properties", p.id));
  await Promise.allSettled(p.images.map((i) => deleteCloudinaryAsset(i.publicId)));
}

/** Fetch published properties by id (individual reads, so Firestore rules can evaluate each document). */
export async function fetchPropertiesByIds(ids: string[], max = 30): Promise<Property[]> {
  const rows = await Promise.all(
    ids.slice(0, max).map((id) => getDoc(doc(getDb(), "properties", id)).then((s) => fromSnap<Property>(s)).catch(() => null)),
  );
  return rows.filter((p): p is Property => !!p && p.status === "published");
}

/** Records a page view server-side (deduplicated per visitor/day). Fire and forget. */
export function trackPropertyView(propertyId: string) {
  callFunction<{ propertyId: string }, { ok: boolean }>("trackPropertyView", { propertyId }).catch(() => undefined);
}

/** Published listings of one lister (public agent page). Equality filters only, so no composite index is needed. */
export async function getPublishedByOwner(ownerId: string): Promise<Property[]> {
  const snap = await getDocs(query(collection(getDb(), "properties"), where("ownerId", "==", ownerId), where("status", "==", "published")));
  return fromSnaps<Property>(snap.docs).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}
