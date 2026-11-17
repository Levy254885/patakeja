"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import { PageHeader, Card } from "@/components/ui/Misc";
import { Input, Select, Textarea, Checkbox } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { ImageUploader } from "@/components/forms/ImageUploader";
import { updateMyProfile } from "@/lib/services/profile";
import { normalizeKenyanPhone } from "@/lib/format";
import type { CloudImage, UserProfile } from "@/lib/types";

const OCC = [{ value: "student", label: "Student" }, { value: "employed", label: "Employed" }, { value: "self-employed", label: "Self-employed" }, { value: "other", label: "Other" }];

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const toast = useToast();
  const [f, setF] = useState<Partial<UserProfile>>({});
  const [photo, setPhoto] = useState<CloudImage[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (profile && !ready) { setF(profile); setPhoto(profile.photo ? [profile.photo] : []); setReady(true); }
  }, [profile, ready]);

  if (!user || !profile) return <Spinner />;
  const lister = profile.role === "landlord" || profile.role === "agent";
  const set = <K extends keyof UserProfile>(k: K, v: UserProfile[K]) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!f.fullName?.trim()) err.fullName = "Enter your full name.";
    if (!f.phone || !normalizeKenyanPhone(f.phone)) err.phone = "Enter a valid Kenyan phone number, e.g. 0712 345 678.";
    if (f.altPhone && !normalizeKenyanPhone(f.altPhone)) err.altPhone = "Enter a valid Kenyan phone number.";
    if (f.householdSize != null && (f.householdSize < 1 || f.householdSize > 50)) err.householdSize = "Enter a number between 1 and 50.";
    setErrors(err);
    if (Object.keys(err).length) return;
    setSaving(true);
    try {
      await updateMyProfile(user.uid, {
        fullName: f.fullName!.trim(), phone: normalizeKenyanPhone(f.phone!) ?? f.phone, altPhone: f.altPhone ? normalizeKenyanPhone(f.altPhone) ?? f.altPhone : undefined,
        photo: photo[0] ?? null, occupation: f.occupation, institution: f.institution?.trim(), shareInstitution: !!f.shareInstitution,
        householdSize: f.householdSize, preferredArea: f.preferredArea?.trim(),
        ...(lister ? { companyName: f.companyName?.trim(), bio: f.bio?.trim() } : {}),
      }, lister);
      await refreshProfile();
      toast.success("Profile saved.");
    } catch (x) {
      toast.error(x instanceof Error ? x.message : "Could not save your profile.");
    } finally { setSaving(false); }
  };

  return (
    <>
      <PageHeader title="My profile" description="Keep your details up to date so listers can reach you." />
      <form onSubmit={submit} className="max-w-2xl space-y-5" noValidate>
        <Card title="Photo">
          <div className="max-w-[10rem]"><ImageUploader value={photo} onChange={setPhoto} max={1} kind="avatar" /></div>
        </Card>
        <Card title="Your details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Full name" required value={f.fullName ?? ""} onChange={(e) => set("fullName", e.target.value)} error={errors.fullName} />
            <Input label="Email" value={profile.email} disabled hint="Email cannot be changed here." />
            <Input label="Phone" required inputMode="tel" value={f.phone ?? ""} onChange={(e) => set("phone", e.target.value)} error={errors.phone} />
            <Input label="Alternative phone" inputMode="tel" value={f.altPhone ?? ""} onChange={(e) => set("altPhone", e.target.value)} error={errors.altPhone} />
          </div>
        </Card>
        {lister ? (
          <Card title="Public profile">
            <div className="space-y-4">
              <Input label="Company or agency name" value={f.companyName ?? ""} onChange={(e) => set("companyName", e.target.value)} />
              <Textarea label="About you" rows={4} value={f.bio ?? ""} onChange={(e) => set("bio", e.target.value)} hint="Shown on your public agent page." />
            </div>
          </Card>
        ) : (
          <Card title="About your search">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Occupation" placeholder="Select" options={OCC} value={f.occupation ?? ""} onChange={(e) => set("occupation", (e.target.value || undefined) as UserProfile["occupation"])} />
              <Input label="School or workplace" value={f.institution ?? ""} onChange={(e) => set("institution", e.target.value)} hint="Used only for location suggestions." />
              <Input label="Household size" type="number" min={1} value={f.householdSize ?? ""} onChange={(e) => set("householdSize", e.target.value ? Number(e.target.value) : undefined)} error={errors.householdSize} />
              <Input label="Preferred area" value={f.preferredArea ?? ""} onChange={(e) => set("preferredArea", e.target.value)} />
            </div>
            <Checkbox className="mt-4" label="Allow listers to see my school or workplace" checked={!!f.shareInstitution} onChange={(e) => set("shareInstitution", e.target.checked)} />
          </Card>
        )}
        <Button type="submit" loading={saving}>Save changes</Button>
      </form>
    </>
  );
}
