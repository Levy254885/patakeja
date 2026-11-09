"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useAuth } from "@/context/AuthProvider";
import { getSavedIds, toggleSaved } from "@/lib/services/saved";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";

export function SaveButton({ propertyId, className, label }: { propertyId: string; className?: string; label?: boolean }) {
  const { user, configured } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!user || !configured) return setSaved(false);
    getSavedIds(user.uid).then((ids) => setSaved(ids.includes(propertyId))).catch(() => undefined);
  }, [user, configured, propertyId]);
  const click = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) return router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    setBusy(true);
    try { const now = await toggleSaved(user.uid, propertyId); setSaved(now); toast.success(now ? "Saved to your favourites" : "Removed from favourites"); }
    catch { toast.error("Could not update favourites. Try again."); }
    finally { setBusy(false); }
  };
  return (
    <button onClick={click} disabled={busy} aria-pressed={saved} aria-label={saved ? "Remove from saved" : "Save property"}
      className={cn("inline-flex items-center gap-1.5 rounded bg-white/95 p-2 text-charcoal hover:text-danger", label && "px-3 text-sm", className)}>
      <Heart className={cn("h-4 w-4", saved && "fill-danger text-danger")} />{label && (saved ? "Saved" : "Save")}
    </button>
  );
}
