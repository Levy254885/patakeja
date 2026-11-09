"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useAuth } from "@/context/AuthProvider";
import { useAsync } from "@/hooks/useAsync";
import { Button } from "@/components/ui/Button";
import { Checkbox, Input, Segmented, Select, Textarea } from "@/components/ui/Field";
import { Card } from "@/components/ui/Misc";
import { ErrorState, Spinner } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { ImageUploader } from "@/components/forms/ImageUploader";
import { getAmenities, getCategories, getGeneralSettings, getLocationIndex } from "@/lib/services/catalog";
import { getMyPropertyContact, getProperty, saveProperty, type PropertyInput } from "@/lib/services/properties";
import { normalizeKenyanPhone, formatKES } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Availability, CloudImage, Furnishing, ListingType } from "@/lib/types";
import { RegistrationGate, useRegistrationGate } from "./RegistrationGate";

const STEPS = ["Basics", "Location", "Details", "Photos", "Contact & review"];
const OTHER = "__other";

interface Form {
  title: string; description: string; listingType: ListingType; categoryId: string; availability: Availability;
  countyId: string; subcounty: string; area: string; otherTown: string; estate: string; address: string;
  price: string; deposit: string; bedrooms: string; bathrooms: string; sizeSqm: string; landSizeAcres: string; furnishing: Furnishing | "";
  amenities: string[]; images: CloudImage[];
  contactName: string; phone: string; whatsapp: string; altPhone: string; email: string;
}
const EMPTY: Form = {
  title: "", description: "", listingType: "rent", categoryId: "", availability: "available",
  countyId: "", subcounty: "", area: "", otherTown: "", estate: "", address: "",
  price: "", deposit: "", bedrooms: "", bathrooms: "", sizeSqm: "", landSizeAcres: "", furnishing: "",
  amenities: [], images: [], contactName: "", phone: "", whatsapp: "", altPhone: "", email: "",
};
const num = (s: string) => (s.trim() === "" ? undefined : Number(s));

export function PropertyWizard({ propertyId }: { propertyId?: string }) {
  const router = useRouter();
  const toast = useToast();
  const { profile } = useAuth();
  const gate = useRegistrationGate();
  const meta = useAsync(async () => {
    const [categories, amenities, locations, general] = await Promise.all([getCategories(), getAmenities(), getLocationIndex(), getGeneralSettings()]);
    return { categories, amenities, locations, general };
  }, []);
  const existing = useAsync(async () => {
    if (!propertyId) return null;
    const [p, c] = await Promise.all([getProperty(propertyId), getMyPropertyContact(propertyId)]);
    return { p, c };
  }, [propertyId]);

  const [form, setForm] = useState<Form>(EMPTY);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<"" | "draft" | "submit">("");
  const [loaded, setLoaded] = useState(false);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (loaded || !meta.data || existing.loading) return;
    const p = existing.data?.p;
    if (p) {
      const c = existing.data?.c;
      const areas = meta.data.locations.areas(p.location.countyId);
      const known = areas.some((a) => a.name === p.location.town);
      setForm({
        title: p.title, description: p.description, listingType: p.listingType, categoryId: p.categoryId, availability: p.availability,
        countyId: p.location.countyId, subcounty: p.location.subcounty ?? "", area: known ? p.location.town : OTHER, otherTown: known ? "" : p.location.town,
        estate: p.location.estate ?? "", address: p.location.address ?? "",
        price: String(p.price), deposit: p.depositAmount != null ? String(p.depositAmount) : "", bedrooms: p.bedrooms != null ? String(p.bedrooms) : "",
        bathrooms: p.bathrooms != null ? String(p.bathrooms) : "", sizeSqm: p.sizeSqm != null ? String(p.sizeSqm) : "",
        landSizeAcres: p.landSizeAcres != null ? String(p.landSizeAcres) : "", furnishing: p.furnishing ?? "",
        amenities: p.amenities ?? [], images: p.images ?? [],
        contactName: c?.contactName ?? "", phone: c?.phone ?? "", whatsapp: c?.whatsapp ?? "", altPhone: c?.altPhone ?? "", email: c?.email ?? "",
      });
    } else if (profile) {
      setForm((f) => ({ ...f, contactName: profile.fullName, phone: profile.phone, email: profile.email }));
    }
    setLoaded(true);
  }, [meta.data, existing.data, existing.loading, loaded, profile]);

  const cat = useMemo(() => meta.data?.categories.find((c) => c.id === form.categoryId), [meta.data, form.categoryId]);
  const group = cat?.group;
  const loc = meta.data?.locations;
  const subcounties = loc && form.countyId ? loc.subcounties(form.countyId) : [];
  const areas = loc && form.countyId ? loc.areas(form.countyId) : [];

  const validate = (s: number): Record<string, string> => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (form.title.trim().length < 5) e.title = "Enter a title of at least 5 characters.";
      if (!form.categoryId) e.categoryId = "Choose a category.";
      if (form.description.trim().length < 20) e.description = "Describe the property in at least 20 characters.";
    }
    if (s === 1) {
      if (!form.countyId) e.countyId = "Choose a county.";
      if (!form.area) e.area = "Choose a town or area.";
      if (form.area === OTHER && !form.otherTown.trim()) e.otherTown = "Type the town or area name.";
    }
    if (s === 2) {
      const p = Number(form.price);
      if (!form.price || !(p > 0)) e.price = "Enter a price above zero.";
      for (const k of ["deposit", "bedrooms", "bathrooms", "sizeSqm", "landSizeAcres"] as const) {
        if (form[k] !== "" && !(Number(form[k]) >= 0)) e[k] = "Enter a valid number.";
      }
    }
    if (s === 3 && form.images.length === 0) e.images = "Add at least one photo.";
    if (s === 4) {
      if (!form.contactName.trim()) e.contactName = "Enter a contact name.";
      if (!normalizeKenyanPhone(form.phone)) e.phone = "Enter a valid Kenyan phone number.";
      if (form.whatsapp && !normalizeKenyanPhone(form.whatsapp)) e.whatsapp = "Enter a valid number or leave blank.";
      if (form.altPhone && !normalizeKenyanPhone(form.altPhone)) e.altPhone = "Enter a valid number or leave blank.";
      if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email.";
    }
    return e;
  };

  const next = () => {
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length) return;
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
    window.scrollTo({ top: 0 });
  };

  const save = async (submit: boolean) => {
    if (!profile || !meta.data) return;
    // Drafts only need the essentials; submitting needs every step valid.
    const toCheck = submit ? [0, 1, 2, 3, 4] : [0];
    for (const s of toCheck) {
      const e = validate(s);
      if (Object.keys(e).length) { setErrors(e); setStep(s); toast.error(submit ? "Please fix the highlighted fields." : "A draft needs at least a title, category and description."); return; }
    }
    if (submit && gate.blocked) return toast.error("Pay the registration fee to publish. Your draft can still be saved.");
    setBusy(submit ? "submit" : "draft");
    try {
      const county = loc?.county(form.countyId);
      const town = form.area === OTHER ? form.otherTown.trim() : form.area;
      const input: PropertyInput = {
        title: form.title, description: form.description, listingType: form.listingType, categoryId: form.categoryId,
        price: Number(form.price) || 0, depositAmount: form.listingType === "rent" ? num(form.deposit) : undefined,
        bedrooms: group === "residential" ? num(form.bedrooms) : undefined, bathrooms: group === "residential" ? num(form.bathrooms) : undefined,
        sizeSqm: group === "land" ? undefined : num(form.sizeSqm), landSizeAcres: group === "land" ? num(form.landSizeAcres) : undefined,
        furnishing: form.furnishing || undefined, amenities: form.amenities,
        location: { countyId: form.countyId, county: county?.name ?? "", subcounty: form.subcounty || undefined, town, estate: form.estate.trim() || undefined, address: form.address.trim() || undefined },
        images: form.images, availability: form.availability,
        contact: { contactName: form.contactName.trim(), phone: normalizeKenyanPhone(form.phone) ?? form.phone, whatsapp: normalizeKenyanPhone(form.whatsapp) ?? undefined, altPhone: normalizeKenyanPhone(form.altPhone) ?? undefined, email: form.email.trim() || undefined },
      };
      await saveProperty({ id: propertyId, input, owner: profile, categories: meta.data.categories, amenities: meta.data.amenities, requireApproval: meta.data.general.requireListingApproval, submit });
      toast.success(!submit ? "Draft saved." : meta.data.general.requireListingApproval ? "Submitted for review. We will notify you once it is approved." : "Your listing is now live.");
      router.push("/portal/properties");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the property.");
    } finally {
      setBusy("");
    }
  };

  if (meta.loading || existing.loading || !loaded) return meta.error ? <ErrorState message={meta.error} onRetry={meta.reload} /> : <Spinner />;
  if (meta.error) return <ErrorState message={meta.error} onRetry={meta.reload} />;
  if (existing.error) return <ErrorState message={existing.error} onRetry={existing.reload} />;
  if (propertyId && (!existing.data?.p || existing.data.p.ownerId !== profile?.uid)) return <ErrorState message="This property was not found in your account." />;
  const m = meta.data!;
  const cats = m.categories.filter((c) => c.active);
  const err = (k: string) => errors[k];

  return (
    <div className="mx-auto max-w-3xl">
      <ol className="mb-6 flex gap-1.5" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s} className="flex-1">
            <button type="button" onClick={() => { if (i < step) setStep(i); }} disabled={i > step}
              className={cn("w-full border-t-2 pt-2 text-left text-xs", i <= step ? "border-forest text-forest" : "border-line text-muted")}>
              <span className="hidden sm:inline">{i + 1}. {s}</span><span className="sm:hidden">{i + 1}</span>
            </button>
          </li>
        ))}
      </ol>

      <Card title={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`}>
        {step === 0 && (
          <div className="space-y-4">
            <Segmented value={form.listingType} onChange={(v) => set("listingType", v)} options={[{ value: "rent", label: "For rent" }, { value: "sale", label: "For sale" }]} />
            <Input label="Title" required value={form.title} onChange={(e) => set("title", e.target.value)} error={err("title")} placeholder="e.g. Spacious 2 bedroom apartment in Kilimani" />
            <Select label="Category" required value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} error={err("categoryId")} placeholder="Select a category"
              options={cats.map((c) => ({ value: c.id, label: c.name }))} />
            <Textarea label="Description" required rows={6} value={form.description} onChange={(e) => set("description", e.target.value)} error={err("description")} hint="Describe the space, neighbourhood and what is included." />
            <Select label="Availability" value={form.availability} onChange={(e) => set("availability", e.target.value as Availability)}
              options={[{ value: "available", label: "Available" }, { value: "under-offer", label: "Under offer" }, { value: "rented", label: "Rented" }, { value: "sold", label: "Sold" }]} />
          </div>
        )}
        {step === 1 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="County" required value={form.countyId} error={err("countyId")} placeholder="Select a county"
              onChange={(e) => setForm((f) => ({ ...f, countyId: e.target.value, subcounty: "", area: "", otherTown: "" }))}
              options={(loc?.counties ?? []).map((c) => ({ value: c.id, label: c.name }))} />
            <Select label="Sub-county" value={form.subcounty} onChange={(e) => set("subcounty", e.target.value)} placeholder={form.countyId ? "Select (optional)" : "Choose a county first"} disabled={!form.countyId}
              options={subcounties.map((c) => ({ value: c.name, label: c.name }))} />
            <Select label="Town / estate" required value={form.area} error={err("area")} onChange={(e) => set("area", e.target.value)} placeholder={form.countyId ? "Select town or estate" : "Choose a county first"} disabled={!form.countyId}
              options={[...areas.map((a) => ({ value: a.name, label: a.name })), { value: OTHER, label: "Other (type it)" }]} />
            {form.area === OTHER && <Input label="Town or area name" required value={form.otherTown} onChange={(e) => set("otherTown", e.target.value)} error={err("otherTown")} />}
            <Input label="Estate or neighbourhood" value={form.estate} onChange={(e) => set("estate", e.target.value)} hint="Optional" />
            <Input label="Street or landmark" className="sm:col-span-2" value={form.address} onChange={(e) => set("address", e.target.value)} hint="Optional and shown publicly. Do not enter a house number you want kept private." />
          </div>
        )}
        {step === 2 && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label={form.listingType === "rent" ? "Monthly rent (KES)" : "Selling price (KES)"} required type="number" min={0} value={form.price} onChange={(e) => set("price", e.target.value)} error={err("price")} />
              {form.listingType === "rent" && <Input label="Deposit (KES)" type="number" min={0} value={form.deposit} onChange={(e) => set("deposit", e.target.value)} error={err("deposit")} />}
              {group === "residential" && <>
                <Input label="Bedrooms" type="number" min={0} value={form.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} error={err("bedrooms")} />
                <Input label="Bathrooms" type="number" min={0} value={form.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} error={err("bathrooms")} />
              </>}
              {group === "land"
                ? <Input label="Land size (acres)" type="number" min={0} step="any" value={form.landSizeAcres} onChange={(e) => set("landSizeAcres", e.target.value)} error={err("landSizeAcres")} />
                : <Input label="Floor area (sqm)" type="number" min={0} value={form.sizeSqm} onChange={(e) => set("sizeSqm", e.target.value)} error={err("sizeSqm")} />}
              {group !== "land" && <Select label="Furnishing" value={form.furnishing} onChange={(e) => set("furnishing", e.target.value as Furnishing | "")} placeholder="Not specified"
                options={[{ value: "unfurnished", label: "Unfurnished" }, { value: "semi-furnished", label: "Semi-furnished" }, { value: "furnished", label: "Furnished" }]} />}
            </div>
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-charcoal">Amenities</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {m.amenities.filter((a) => a.active && (group === "land" ? a.group === "land" : a.group !== "land")).map((a) => (
                  <Checkbox key={a.id} label={a.name} checked={form.amenities.includes(a.id)}
                    onChange={(e) => set("amenities", e.target.checked ? [...form.amenities, a.id] : form.amenities.filter((x) => x !== a.id))} />
                ))}
              </div>
            </fieldset>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-2">
            <p className="text-sm text-muted">The first photo is the cover. Use the arrows to reorder.</p>
            <ImageUploader value={form.images} onChange={(v) => set("images", v)} />
            {err("images") && <p className="text-xs text-danger" role="alert">{err("images")}</p>}
          </div>
        )}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="font-heading text-sm font-semibold text-charcoal">Private contact details</h3>
              <p className="mb-3 text-xs text-muted">Stored privately. Tenants only see these after paying the contact access fee.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Contact name" required value={form.contactName} onChange={(e) => set("contactName", e.target.value)} error={err("contactName")} />
                <Input label="Phone" required type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} error={err("phone")} />
                <Input label="WhatsApp" type="tel" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} error={err("whatsapp")} />
                <Input label="Alternative phone" type="tel" value={form.altPhone} onChange={(e) => set("altPhone", e.target.value)} error={err("altPhone")} />
                <Input label="Email" type="email" className="sm:col-span-2" value={form.email} onChange={(e) => set("email", e.target.value)} error={err("email")} />
              </div>
            </div>
            <div className="rounded border border-line bg-ivory p-4 text-sm">
              <h3 className="mb-2 font-heading font-semibold text-charcoal">Review</h3>
              <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-[auto,1fr]">
                <dt className="text-muted">Title</dt><dd>{form.title}</dd>
                <dt className="text-muted">Type</dt><dd>{cat?.name} ({form.listingType === "rent" ? "for rent" : "for sale"})</dd>
                <dt className="text-muted">Price</dt><dd>{formatKES(Number(form.price))}{form.listingType === "rent" ? " / month" : ""}</dd>
                <dt className="text-muted">Location</dt><dd>{[form.estate, form.area === OTHER ? form.otherTown : form.area, loc?.county(form.countyId)?.name].filter(Boolean).join(", ")}</dd>
                <dt className="text-muted">Photos</dt><dd>{form.images.length}</dd>
                <dt className="text-muted">Amenities</dt><dd>{form.amenities.length}</dd>
              </dl>
              <p className="mt-3 text-xs text-muted">{m.general.requireListingApproval ? "New listings are reviewed by our team before going live." : "Your listing goes live as soon as you submit."}</p>
            </div>
            <RegistrationGate />
          </div>
        )}
      </Card>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => (step === 0 ? router.push("/portal/properties") : setStep(step - 1))}><ArrowLeft className="h-4 w-4" /> {step === 0 ? "Cancel" : "Back"}</Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" loading={busy === "draft"} disabled={!!busy} onClick={() => save(false)}>Save draft</Button>
          {step < STEPS.length - 1
            ? <Button onClick={next}>Next <ArrowRight className="h-4 w-4" /></Button>
            : <Button loading={busy === "submit"} disabled={!!busy || gate.blocked} onClick={() => save(true)}><Check className="h-4 w-4" /> {m.general.requireListingApproval ? "Submit for review" : "Publish"}</Button>}
        </div>
      </div>
    </div>
  );
}
