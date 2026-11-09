import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bath, BedDouble, CalendarCheck, MapPin, Ruler, Sofa } from "lucide-react";
import { getPublishedProperty, getSimilarProperties } from "@/lib/server/firestore-rest";
import { idFromSlug, formatDate } from "@/lib/format";
import { imageUrl } from "@/lib/cloudinary";
import { pageMeta, propertyDescription, propertyJsonLd } from "@/lib/seo";
import { PropertyGallery } from "@/components/property/PropertyGallery";
import { PropertyCard } from "@/components/property/PropertyCard";
import { Price } from "@/components/property/Price";
import { ContactUnlock } from "@/components/property/ContactUnlock";
import { PropertyActions } from "@/components/property/PropertyActions";
import { DetailTracker } from "@/components/property/DetailTracker";
import { Breadcrumbs, Avatar } from "@/components/ui/Misc";
import { DemoBadge, VerifiedBadge } from "@/components/ui/Badge";

export const revalidate = 300;
type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getPublishedProperty(idFromSlug(params.slug));
  if (!p) return { title: "Property not found", robots: { index: false } };
  return pageMeta(p.title, propertyDescription(p), `/property/${p.slug}`, { image: imageUrl(p.images?.[0], { w: 1200 }) ?? undefined });
}

export default async function PropertyPage({ params }: Props) {
  const p = await getPublishedProperty(idFromSlug(params.slug));
  if (!p) notFound();
  const similar = await getSimilarProperties(p, 4);
  const loc = p.location;
  const mapQ = loc.lat && loc.lng ? `${loc.lat},${loc.lng}` : encodeURIComponent([loc.address, loc.estate, loc.town, loc.county, "Kenya"].filter(Boolean).join(", "));
  const facts = [
    p.bedrooms !== undefined && { icon: BedDouble, label: "Bedrooms", value: p.bedrooms === 0 ? "Studio" : String(p.bedrooms) },
    p.bathrooms !== undefined && { icon: Bath, label: "Bathrooms", value: String(p.bathrooms) },
    p.sizeSqm && { icon: Ruler, label: "Size", value: `${p.sizeSqm} m²` },
    p.landSizeAcres && { icon: Ruler, label: "Land", value: `${p.landSizeAcres} acres` },
    p.furnishing && { icon: Sofa, label: "Furnishing", value: p.furnishing.replace("-", " ") },
    p.publishedAt && { icon: CalendarCheck, label: "Listed", value: formatDate(p.publishedAt) },
  ].filter(Boolean) as { icon: any; label: string; value: string }[];

  return (
    <div className="container-page py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(propertyJsonLd(p)) }} />
      <DetailTracker propertyId={p.id} />
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: p.listingType === "rent" ? "Rent" : "Buy", href: `/${p.listingType === "rent" ? "rent" : "sale"}` }, { label: loc.county, href: `/search?type=${p.listingType}&county=${loc.countyId}` }, { label: p.title }]} />
      <div className="mt-4 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PropertyGallery images={p.images ?? []} title={p.title} />
          <div className="mt-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-heading text-2xl font-bold text-charcoal sm:text-3xl">{p.title}</h1>
              <p className="mt-1 flex items-center gap-1 text-sm text-muted"><MapPin className="h-4 w-4" />{[loc.address, loc.estate, loc.town, loc.county].filter(Boolean).join(", ")}</p>
            </div>
            <div className="text-right"><Price amount={p.price} listingType={p.listingType} className="text-2xl" />{p.depositAmount ? <p className="text-xs text-muted">Deposit {new Intl.NumberFormat("en-KE").format(p.depositAmount)} KES</p> : null}</div>
          </div>
          <div className="mt-3 flex gap-2">{p.verified && <VerifiedBadge />}{p.isDemo && <DemoBadge />}</div>
          <div className="mt-5"><PropertyActions p={p} /></div>
          {facts.length > 0 && <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">{facts.map((f) => (
            <div key={f.label} className="flex items-center gap-3 rounded border border-line bg-white p-3"><f.icon className="h-5 w-5 text-forest" /><div><dt className="text-xs text-muted">{f.label}</dt><dd className="text-sm font-medium capitalize">{f.value}</dd></div></div>))}</dl>}
          <section className="mt-8"><h2 className="font-heading text-lg font-semibold">About this property</h2><p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-charcoal">{p.description}</p></section>
          {!!p.amenityNames?.length && <section className="mt-8"><h2 className="font-heading text-lg font-semibold">Amenities</h2><ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{p.amenityNames.map((a) => <li key={a} className="rounded border border-line bg-white px-3 py-2 text-sm">{a}</li>)}</ul></section>}
          <section className="mt-8"><h2 className="font-heading text-lg font-semibold">Location</h2>
            <p className="mt-1 text-sm text-muted">The exact address is shared by the landlord.</p>
            <iframe title="Map" loading="lazy" className="mt-3 h-64 w-full rounded border border-line" src={`https://www.google.com/maps?q=${mapQ}&z=14&output=embed`} />
            <a className="mt-2 inline-block text-sm text-forest hover:underline" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${mapQ}`}>Open in Google Maps</a>
          </section>
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <ContactUnlock propertyId={p.id} ownerId={p.ownerId} />
          <div className="flex items-center gap-3 rounded border border-line bg-white p-4">
            <Avatar name={p.owner.name} src={p.owner.photoUrl} size={44} />
            <div className="min-w-0"><p className="truncate font-medium">{p.owner.name}</p><p className="text-xs capitalize text-muted">{p.owner.role}{p.owner.companyName ? ` · ${p.owner.companyName}` : ""}</p>
              {(p.owner.role === "agent") && <Link href={`/agents/${p.owner.id}`} className="text-xs text-forest hover:underline">View agent profile</Link>}</div>
          </div>
        </aside>
      </div>
      {similar.length > 0 && <section className="mt-12"><h2 className="mb-4 font-heading text-xl font-semibold">Similar properties</h2><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{similar.map((s) => <PropertyCard key={s.id} p={s} />)}</div></section>}
    </div>
  );
}
