"use client";
import { ErrorState, Spinner } from "@/components/ui/States";
import type { AsyncState } from "@/hooks/useAsync";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/context/AuthProvider";
import { getMyProperties } from "@/lib/services/properties";
import type { PriceItem, Property } from "@/lib/types";

/** Renders loading / error states for an async value, then the children with the loaded data. */
export function Loadable<T>({ state, children }: { state: AsyncState<T>; children: (data: T) => React.ReactNode }) {
  if (state.loading && !state.data) return <Spinner />;
  if (state.error) return <ErrorState message={state.error} onRetry={state.reload} />;
  if (!state.data) return null;
  return <>{children(state.data)}</>;
}

/** The signed-in lister's properties (all statuses). */
export function useMyProperties(): AsyncState<Property[]> {
  const { user } = useAuth();
  const uid = user?.uid ?? "";
  return useAsync(() => getMyProperties(uid), [uid], !!uid);
}

/** Price shown to the user: promotional amount while the promo is running. The server still decides the real charge. */
export function effectiveAmount(item: PriceItem): number {
  if (item.promoAmount != null && (!item.promoEndsAt || item.promoEndsAt > Date.now())) return item.promoAmount;
  return item.amount;
}

export const PURPOSE_LABEL: Record<string, string> = {
  "contact-access": "Contact access",
  "landlord-registration": "Landlord registration",
  boost: "Listing boost",
};
