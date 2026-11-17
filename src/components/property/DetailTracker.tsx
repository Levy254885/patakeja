"use client";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthProvider";
import { trackPropertyView } from "@/lib/services/properties";
import { recordRecentlyViewed } from "@/lib/services/saved";

export function DetailTracker({ propertyId }: { propertyId: string }) {
  const { user, configured } = useAuth();
  useEffect(() => { if (configured) trackPropertyView(propertyId); }, [configured, propertyId]);
  useEffect(() => { if (configured && user) recordRecentlyViewed(user.uid, propertyId).catch(() => undefined); }, [configured, user, propertyId]);
  return null;
}
