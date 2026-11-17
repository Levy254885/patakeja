"use client";
import { Building2 } from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { PropertyGrid } from "@/components/property/PropertyCard";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { getPublishedByOwner } from "@/lib/services/properties";

export function AgentListings({ ownerId }: { ownerId: string }) {
  const s = useAsync(() => getPublishedByOwner(ownerId), [ownerId]);
  if (s.error) return <ErrorState message={s.error} onRetry={s.reload} />;
  if (!s.data) return <Skeleton className="h-48 w-full" />;
  if (!s.data.length) return <EmptyState icon={Building2} title="No published listings" message="This lister has no live listings right now." />;
  return <PropertyGrid items={s.data} />;
}
