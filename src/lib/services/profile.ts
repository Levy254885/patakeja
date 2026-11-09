"use client";
import { doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { getDb } from "../firebase/client";
import { clean } from "../firebase/convert";
import type { UserProfile } from "../types";

type Editable = Partial<Pick<UserProfile, "fullName" | "phone" | "altPhone" | "photo" | "occupation" | "institution" | "shareInstitution" | "householdSize" | "preferredCountyId" | "preferredArea" | "companyName" | "bio" | "agencyLicense">>;

/** Update the signed-in user's own profile. Role, verification and fee flags are protected by Firestore rules. */
export async function updateMyProfile(uid: string, patch: Editable, isLister = false) {
  await updateDoc(doc(getDb(), "users", uid), clean({ ...patch, updatedAt: serverTimestamp() }));
  if (isLister) {
    await setDoc(doc(getDb(), "publicProfiles", uid), clean({
      name: patch.fullName, companyName: patch.companyName, bio: patch.bio, photo: patch.photo,
    }), { merge: true });
  }
}
