"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Checkbox } from "@/components/ui/Field";
import { Card, PageHeader } from "@/components/ui/Misc";
import { AsyncView, useAction } from "@/components/admin/common";
import { useAsync } from "@/hooks/useAsync";
import { getGeneralSettings } from "@/lib/services/catalog";
import { saveGeneralSettings } from "@/lib/services/admin";
import type { GeneralSettings } from "@/lib/types";

function Form({ initial }: { initial: GeneralSettings }) {
  const run = useAction();
  const [v, setV] = useState<GeneralSettings>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => setV(initial), [initial]);
  const set = <K extends keyof GeneralSettings>(k: K, x: GeneralSettings[K]) => setV((s) => ({ ...s, [k]: x }));

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!v.siteName.trim()) e.siteName = "Site name is required";
    if (v.supportEmail && !/^\S+@\S+\.\S+$/.test(v.supportEmail)) e.supportEmail = "Enter a valid email";
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    await run(() => saveGeneralSettings({ ...v, siteName: v.siteName.trim(), tagline: v.tagline.trim(), supportEmail: v.supportEmail.trim(), supportPhone: v.supportPhone.trim(), whatsapp: v.whatsapp.trim() }), "Settings saved");
    setSaving(false);
  };

  return (
    <Card className="max-w-2xl space-y-4 p-5">
      <Input label="Site name" value={v.siteName} error={errors.siteName} onChange={(e) => set("siteName", e.target.value)} />
      <Input label="Tagline" value={v.tagline} onChange={(e) => set("tagline", e.target.value)} />
      <Input label="Support email" type="email" value={v.supportEmail} error={errors.supportEmail} onChange={(e) => set("supportEmail", e.target.value)} />
      <Input label="Support phone" value={v.supportPhone} onChange={(e) => set("supportPhone", e.target.value)} />
      <Input label="WhatsApp number" value={v.whatsapp} hint="International format, e.g. 2547XXXXXXXX" onChange={(e) => set("whatsapp", e.target.value)} />
      <Checkbox label="Require admin approval before listings go live" checked={v.requireListingApproval} onChange={(e) => set("requireListingApproval", e.target.checked)} />
      <Checkbox label="Maintenance mode" checked={!!v.maintenanceMode} onChange={(e) => set("maintenanceMode", e.target.checked)} />
      <Button loading={saving} onClick={submit}>Save settings</Button>
    </Card>
  );
}

export default function AdminSettingsPage() {
  const state = useAsync(getGeneralSettings, []);
  return (
    <div className="space-y-4">
      <PageHeader title="Settings" description="General site settings and contact details." />
      <AsyncView state={state}>{(g) => <Form initial={g} />}</AsyncView>
    </div>
  );
}
