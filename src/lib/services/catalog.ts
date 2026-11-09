"use client";
import { collection, doc, getDoc, getDocs, orderBy, query } from "firebase/firestore";
import { getDb } from "../firebase/client";
import { fromSnap, fromSnaps } from "../firebase/convert";
import { indexLocations, mergeLocations, staticNodes, type LocationIndex } from "../locations";
import { DEFAULT_PRICING, DEFAULT_GENERAL, DEFAULT_CATEGORIES, DEFAULT_AMENITIES } from "../defaults";
import type { Amenity, GeneralSettings, LocationNode, PricingSettings, PropertyCategory } from "../types";

/** Categories (Firestore `propertyCategories`, with bundled defaults when the collection is empty). */
export async function getCategories(): Promise<PropertyCategory[]> {
  try {
    const snap = await getDocs(query(collection(getDb(), "propertyCategories"), orderBy("order")));
    const rows = fromSnaps<PropertyCategory>(snap.docs).filter((c) => c.active !== false);
    return rows.length ? rows : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export async function getAmenities(): Promise<Amenity[]> {
  try {
    const snap = await getDocs(collection(getDb(), "amenities"));
    const rows = fromSnaps<Amenity>(snap.docs).filter((a) => a.active !== false);
    return rows.length ? rows : DEFAULT_AMENITIES;
  } catch {
    return DEFAULT_AMENITIES;
  }
}

/** Bundled Kenyan locations merged with admin-managed `locations` documents. */
export async function getLocationIndex(): Promise<LocationIndex> {
  try {
    const snap = await getDocs(collection(getDb(), "locations"));
    return indexLocations(mergeLocations(fromSnaps<LocationNode>(snap.docs)));
  } catch {
    return indexLocations(staticNodes());
  }
}

export async function getPricing(): Promise<PricingSettings> {
  try {
    const snap = await getDoc(doc(getDb(), "siteSettings", "pricing"));
    const v = fromSnap<PricingSettings & { id: string }>(snap);
    return v ? { ...DEFAULT_PRICING, ...v } : DEFAULT_PRICING;
  } catch {
    return DEFAULT_PRICING;
  }
}

export async function getGeneralSettings(): Promise<GeneralSettings> {
  try {
    const snap = await getDoc(doc(getDb(), "siteSettings", "general"));
    const v = fromSnap<GeneralSettings & { id: string }>(snap);
    return v ? { ...DEFAULT_GENERAL, ...v } : DEFAULT_GENERAL;
  } catch {
    return DEFAULT_GENERAL;
  }
}
