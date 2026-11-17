"use client";
import { Heart } from "lucide-react";
import { useAuth } from "@/context/AuthProvider";
import { useAsync } from "@/hooks/useAsync";
import { PageHeader } from "@/components/ui/Misc";
import { EmptyState } from "@/components/ui/States";
import { LinkButton } from "@/components/ui/Button";
import { PropertyGrid } from "@/components/property/PropertyCard";
import { Loadable } from "@/components/account/parts";
import { getSavedProperties } from "@/lib/services/saved";

export default function SavedPage() {
  const { user } = useAuth();
  const uid = user?.uid ?? "";
  const s = useAsync(() => getSavedProperties(uid), [uid], !!uid);
  return (
    <>
      <PageHeader title="Saved properties" description="Listings you have saved. Unsaved or unpublished listings no longer appear here." />
      <Loadable state={s} rows={3}>
        {(rows) => rows.length ? <PropertyGrid items={rows} /> : (
          <EmptyState icon={Heart} title="Nothing saved yet" message="Tap the heart on any listing to keep it here for later." action={<LinkButton href="/search">Browse properties</LinkButton>} />
        )}
      </Loadable>
    </>
  );
}
