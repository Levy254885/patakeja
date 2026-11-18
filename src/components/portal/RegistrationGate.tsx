"use client";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/context/AuthProvider";
import { getPricing } from "@/lib/services/catalog";
import { Card } from "@/components/ui/Misc";
import { PaymentPanel } from "./PaymentPanel";
import { effectiveAmount } from "./common";

export interface RegistrationGateState {
  loading: boolean;
  /** true when a fee is enabled by the admin and this lister has not paid yet: publishing is blocked, drafts are not. */
  blocked: boolean;
  amount: number;
}

export function useRegistrationGate(): RegistrationGateState {
  const { profile } = useAuth();
  const pricing = useAsync(getPricing, []);
  const item = pricing.data?.landlordRegistration;
  const required = !!item && item.enabled && effectiveAmount(item) > 0;
  return { loading: pricing.loading, blocked: !!profile && required && !profile.registrationFeePaid, amount: item ? effectiveAmount(item) : 0 };
}

/** Payment prompt for the one-off landlord registration fee. Renders nothing when no fee is due. */
export function RegistrationGate({ className }: { className?: string }) {
  const { refreshProfile } = useAuth();
  const gate = useRegistrationGate();
  if (gate.loading || !gate.blocked) return null;
  return (
    <Card title="Registration fee required to publish" className={className}>
      <p className="mb-4 text-sm text-muted">A one-time registration fee applies before your listings can go live. You can still create and save drafts without paying.</p>
      <PaymentPanel purpose="landlord-registration" amount={gate.amount} label="Pay registration fee" onPaid={() => { refreshProfile(); }} />
    </Card>
  );
}
