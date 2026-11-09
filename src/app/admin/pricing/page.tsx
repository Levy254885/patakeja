"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Checkbox } from "@/components/ui/Field";
import { Card, PageHeader } from "@/components/ui/Misc";
import { AsyncView, useAction } from "@/components/admin/common";
import { useAsync } from "@/hooks/useAsync";
import { getPricingDoc, updatePricing } from "@/lib/services/admin";
import { DEFAULT_PRICING } from "@/lib/defaults";
import type { PriceItem, PricingSettings } from "@/lib/types";

type Key = "landlordRegistration" | "contactAccess" | "boost";
const ITEMS: { key: Key; label: string; hint: string }[] = [
  { key: "landlordRegistration", label: "Landlord registration", hint: "One-off fee before a landlord or agent can list." },
  { key: "contactAccess", label: "Contact access", hint: "Per property, paid by a tenant to see contact details." },
  { key: "boost", label: "Listing boost", hint: "Per boost period." },
];

function Form({ initial, exists }: { initial: PricingSettings; exists: boolean }) {
  const run = useAction();
  const [p, setP] = useState<PricingSettings>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => setP(initial), [initial]);
  const patch = (k: Key, v: Partial<PriceItem> & { durationHours?: number }) => setP((s) => ({ ...s, [k]: { ...s[k], ...v } }));

  const save = async () => {
    const errs: Record<string, string> = {};
    for (const it of ITEMS) {
      const a = p[it.key].amount;
      if (!Number.isFinite(a) || a < 0) errs[`${it.key}.amount`] = "Enter 0 or more";
      const promo = p[it.key].promoAmount;
      if (promo != null && (!Number.isFinite(promo) || promo < 0)) errs[`${it.key}.promo`] = "Enter 0 or more";
    }
    if (!Number.isFinite(p.boost.durationHours) || p.boost.durationHours < 1) errs["boost.hours"] = "At least 1 hour";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    const { updatedAt: _u, updatedBy: _b, ...payload } = p;
    await run(() => updatePricing(payload as PricingSettings), "Pricing updated");
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      {!exists && <p className="rounded border border-line bg-white p-3 text-sm text-muted">No pricing document exists yet. The values below are the defaults; saving will create it.</p>}
      {ITEMS.map((it) => (
        <Card key={it.key} title={it.label}>
          <p className="mb-3 text-sm text-muted">{it.hint}</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Price (KES)" type="number" min={0} value={p[it.key].amount} error={errors[`${it.key}.amount`]} onChange={(e) => patch(it.key, { amount: Number(e.target.value) })} />
            <Input label="Promo price (KES)" type="number" min={0} hint="Leave blank for none" value={p[it.key].promoAmount ?? ""} error={errors[`${it.key}.promo`]} onChange={(e) => patch(it.key, { promoAmount: e.target.value === "" ? undefined : Number(e.target.value) })} />
            {it.key === "boost" && <Input label="Duration (hours)" type="number" min={1} value={p.boost.durationHours} error={errors["boost.hours"]} onChange={(e) => patch("boost", { durationHours: Number(e.target.value) })} />}
          </div>
          <Checkbox className="mt-3" label="Charge enabled" checked={p[it.key].enabled} onChange={(e) => patch(it.key, { enabled: e.target.checked })} />
        </Card>
      ))}
      <Button loading={saving} onClick={save}>Save pricing</Button>
    </div>
  );
}

export default function AdminPricingPage() {
  const state = useAsync(getPricingDoc, []);
  return (
    <div className="space-y-4">
      <PageHeader title="Pricing" description="Prices are read by the server when a payment starts. Changes are audit-logged." />
      <AsyncView state={state}>{(d) => <Form initial={{ ...DEFAULT_PRICING, ...d }} exists />}</AsyncView>
    </div>
  );
}
