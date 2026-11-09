"use client";
import { History } from "lucide-react";
import { useAuth } from "@/context/AuthProvider";
import { useAsync } from "@/hooks/useAsync";
import { PageHeader } from "@/components/ui/Misc";
import { EmptyState } from "@/components/ui/States";
import { LinkButton } from "@/components/ui/Button";
import { PropertyGrid } from "@/components/property/PropertyCard";
import { Loadable } from "@/components/account/parts";
import { getRecentlyViewed } from "@/lib/services/saved";

export default function RecentPage() {
  const { user } = useAuth();
  const uid = user?.uid ?? "";
  const s = useAsync(() => getRecentlyViewed(uid, 24), [uid], !!uid);
  return (
    <>
      <PageHeader title="Recently viewed" description="Properties you opened while signed in, newest first." />
      <Loadable state={s} rows={3}>
        {(rows) => rows.length ? <PropertyGrid items={rows} /> : (
          <EmptyState icon={History} title="No recently viewed properties" message="Listings you open while signed in will appear here." action={<LinkButton href="/search">Browse properties</LinkButton>} />
        )}
      </Loadable>
    </>
  );
}
