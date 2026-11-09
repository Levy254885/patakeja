"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile as updateAuthProfile,
  type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getAuthClient, getDb, initFirebase, isFirebaseConfigured } from "@/lib/firebase/client";
import { clean, fromSnap } from "@/lib/firebase/convert";
import { ADMIN_ROLES, type Role, type UserProfile } from "@/lib/types";

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  altPhone?: string;
  role: Extract<Role, "customer" | "landlord" | "agent">;
  occupation?: UserProfile["occupation"];
  institution?: string;
  householdSize?: number;
  companyName?: string;
}

interface AuthState {
  configured: boolean;
  loading: boolean;
  user: User | null;
  profile: UserProfile | null;
  /** Effective role: admin roles come from server-set custom claims, others from the profile document. */
  role: Role | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [claimRole, setClaimRole] = useState<Role | null>(null);

  const loadProfile = useCallback(async (u: User | null) => {
    if (!u) {
      setProfile(null);
      setClaimRole(null);
      return;
    }
    const token = await u.getIdTokenResult();
    const r = token.claims.role as Role | undefined;
    setClaimRole(r && ADMIN_ROLES.includes(r) ? r : null);
    const snap = await getDoc(doc(getDb(), "users", u.uid));
    setProfile(fromSnap<UserProfile & { id: string }>(snap) as unknown as UserProfile | null);
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    initFirebase();
    const unsub = onAuthStateChanged(getAuthClient(), async (u) => {
      setUser(u);
      try {
        await loadProfile(u);
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, [loadProfile]);

  const value = useMemo<AuthState>(() => {
    const role = claimRole ?? profile?.role ?? null;
    return {
      configured: isFirebaseConfigured,
      loading,
      user,
      profile,
      role,
      isAdmin: !!role && ADMIN_ROLES.includes(role),
      signIn: async (email, password) => {
        await signInWithEmailAndPassword(getAuthClient(), email.trim(), password);
      },
      register: async (input) => {
        const cred = await createUserWithEmailAndPassword(getAuthClient(), input.email.trim(), input.password);
        await updateAuthProfile(cred.user, { displayName: input.fullName });
        const data = clean({
          uid: cred.user.uid,
          email: input.email.trim().toLowerCase(),
          role: input.role,
          fullName: input.fullName.trim(),
          phone: input.phone.trim(),
          altPhone: input.altPhone?.trim() || undefined,
          occupation: input.occupation,
          institution: input.institution?.trim() || undefined,
          shareInstitution: false,
          householdSize: input.householdSize,
          companyName: input.companyName?.trim() || undefined,
          verification: "none",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        await setDoc(doc(getDb(), "users", cred.user.uid), data);
        if (input.role !== "customer") {
          await setDoc(doc(getDb(), "publicProfiles", cred.user.uid), clean({
            name: input.fullName.trim(),
            role: input.role,
            companyName: input.companyName?.trim() || undefined,
            verified: false,
            createdAt: serverTimestamp(),
          }));
        }
        await loadProfile(cred.user);
      },
      signOut: async () => {
        await fbSignOut(getAuthClient());
      },
      resetPassword: async (email) => {
        await sendPasswordResetEmail(getAuthClient(), email.trim());
      },
      refreshProfile: async () => {
        await loadProfile(getAuthClient().currentUser);
      },
    };
  }, [loading, user, profile, claimRole, loadProfile]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside <AuthProvider>");
  return v;
}

/** Friendly messages for Firebase Auth error codes. */
export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  const map: Record<string, string> = {
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/wrong-password": "Incorrect email or password.",
    "auth/user-not-found": "Incorrect email or password.",
    "auth/email-already-in-use": "An account with this email already exists. Try logging in.",
    "auth/weak-password": "Choose a stronger password (at least 8 characters).",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/too-many-requests": "Too many attempts. Please wait a few minutes and try again.",
    "auth/network-request-failed": "Network error. Check your connection and try again.",
    "auth/user-disabled": "This account has been disabled. Contact support.",
  };
  return map[code] ?? (err instanceof Error && !code ? err.message : "Something went wrong. Please try again.");
}
