"use client";
import { useState } from "react";
import { Rocket } from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/context/AuthProvider";
import { Card, PageHeader } from "@/components/ui/Misc";
import { Select } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/States";
import { LinkButton } from "@/components/ui/Button";
import { Loadable, effectiveAmount, useMyProperties } from "@/components/portal/common";
import { PaymentPanel } from "@/components/portal/PaymentPanel";
import { getPricing } from "@/lib/services/catalog";
import { getMyBoosts } from "@/lib/services/portal";
import { formatDateTime, formatKES } from "@/lib/format";

export default function BoostPage() {
  const { user } = useAuth();
  const uid = user?.uid ?? "";
  const props = useMyProperties();
  const pricing = useAsync(getPricing, []);
  const boosts = useAsync(() => getMyBoosts(uid), [uid], !!uid);
  const [id, setId] = useState("");
  return (
    <>
      <PageHeader title="Boost listings" description="A boosted listing is shown higher in search results and carries a Boosted label." />
      <Loadable state={props}>
        {(list) => {
          const live = list.filter((p) => p.status === "published");
          const b = pricing.data?.boost;
          if (!live.length) return <EmptyState icon={Rocket} title="No live listings to boost" message="Only published listings can be boosted." action={<LinkButton href="/portal/properties">My properties</LinkButton>} />;
          const sel = live.find((p) => p.id === id);
          return (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card title="Boost a listing">
                <Select label="Listing" value={id} onChange={(e) => setId(e.target.value)} placeholder="Choose a listing"
                  options={live.map((p) => ({ value: p.id, label: p.title + (p.boostedUntil && p.boostedUntil > Date.now() ? " (boosted)" : "") }))} />
                {b && <p className="mt-2 text-sm text-muted">{b.enabled ? `${formatKES(effectiveAmount(b))} for ${b.durationHours} hours.` : "Boosting is currently free."}</p>}
                {sel && b && <div className="mt-4"><PaymentPanel key={sel.id} purpose="boost" propertyId={sel.id} amount={b.enabled ? effectiveAmount(b) : 0} label="Pay and boost" onPaid={() => { boosts.reload(); props.reload(); }} /></div>}
              </Card>
              <Card title="Boost history">
                {boosts.loading ? <p className="text-sm text-muted">Loading...</p> : boosts.error ? <p className="text-sm text-danger">{boosts.error}</p> : !boosts.data?.length ? <p className="text-sm text-muted">No boosts yet.</p> : (
                  <ul className="divide-y divide-line text-sm">
                    {boosts.data.map((c) => {
                      const p = list.find((x) => x.id === c.propertyId);
                      return (<li key={c.id} className="py-2.5"><p className="text-charcoal">{p?.title ?? "Removed listing"}</p>
                        <p className="text-xs text-muted">{formatKES(c.amount)} - {c.endsAt > Date.now() ? "active until" : "ended"} {formatDateTime(c.endsAt)}</p></li>);
                    })}
                  </ul>
                )}
              </Card>
            </div>
          );
        }}
      </Loadable>
    </>
  );
}
