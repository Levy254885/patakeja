"use client";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { getDb } from "../firebase/client";
import { fromSnaps } from "../firebase/convert";
import type { BoostCampaign } from "../types";

/** Boost campaigns are written by Cloud Functions after a successful M-Pesa payment; owners can read their own. */
export async function getMyBoosts(ownerId: string): Promise<BoostCampaign[]> {
  const s = await getDocs(query(collection(getDb(), "boostCampaigns"), where("ownerId", "==", ownerId), orderBy("endsAt", "desc")));
  return fromSnaps<BoostCampaign>(s.docs);
}
