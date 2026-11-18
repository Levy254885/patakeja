"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { Card, PageHeader } from "@/components/ui/Misc";
import { Spinner } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { ImageUploader } from "@/components/forms/ImageUploader";
import { updateMyProfile } from "@/lib/services/profile";
import { normalizeKenyanPhone } from "@/lib/format";
import type { CloudImage } from "@/lib/types";

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const toast = useToast();
  const [f, setF] = useState({ fullName: "", phone: "", altPhone: "", companyName: "", agencyLicense: "", bio: "" });
  const [photo, setPhoto] = useState<CloudImage[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!profile) return;
    setF({ fullName: profile.fullName, phone: profile.phone, altPhone: profile.altPhone ?? "", companyName: profile.companyName ?? "", agencyLicense: profile.agencyLicense ?? "", bio: profile.bio ?? "" });
    setPhoto(profile.photo ? [profile.photo] : []);
  }, [profile?.uid]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!profile) return <Spinner />;
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const save = async () => {
    const e: Record<string, string> = {};
    if (f.fullName.trim().length < 2) e.fullName = "Enter your name.";
    if (!normalizeKenyanPhone(f.phone)) e.phone = "Enter a valid Kenyan phone number.";
    if (f.altPhone && !normalizeKenyanPhone(f.altPhone)) e.altPhone = "Enter a valid number or leave blank.";
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await updateMyProfile(profile.uid, { fullName: f.fullName.trim(), phone: normalizeKenyanPhone(f.phone) ?? f.phone, altPhone: normalizeKenyanPhone(f.altPhone) ?? undefined, companyName: f.companyName.trim() || undefined, agencyLicense: f.agencyLicense.trim() || undefined, bio: f.bio.trim() || undefined, photo: photo[0] ?? null }, true);
      await refreshProfile();
      toast.success("Profile saved.");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Could not save."); }
    finally { setBusy(false); }
  };
  return (
    <>
      <PageHeader title="Profile & company" description="Your name, company and bio appear on your public lister page and listings." />
      <div className="max-w-2xl space-y-6">
        <Card title="Photo or logo"><ImageUploader value={photo} onChange={(v) => setPhoto(v.slice(-1))} max={1} kind="avatar" /></Card>
        <Card title="Details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Full name" required value={f.fullName} onChange={set("fullName")} error={errors.fullName} />
            <Input label="Email" value={profile.email} disabled readOnly />
            <Input label="Phone" required type="tel" value={f.phone} onChange={set("phone")} error={errors.phone} />
            <Input label="Alternative phone" type="tel" value={f.altPhone} onChange={set("altPhone")} error={errors.altPhone} />
            <Input label="Company or agency" value={f.companyName} onChange={set("companyName")} />
            <Input label="Agency licence number" value={f.agencyLicense} onChange={set("agencyLicense")} />
            <Textarea label="Bio" className="sm:col-span-2" rows={4} value={f.bio} onChange={set("bio")} />
          </div>
          <div className="mt-5"><Button loading={busy} onClick={save}>Save changes</Button></div>
        </Card>
      </div>
    </>
  );
}
