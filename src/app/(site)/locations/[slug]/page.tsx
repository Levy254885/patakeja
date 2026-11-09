import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { COUNTIES, STATIC_INDEX, countyBySlug } from "@/lib/locations";
import { searchPublishedProperties } from "@/lib/server/firestore-rest";
import { pageMeta } from "@/lib/seo";
import { Breadcrumbs } from "@/components/ui/Misc";
import { PropertyCard } from "@/components/property/PropertyCard";
import { EmptyState } from "@/components/ui/States";
import { LinkButton } from "@/components/ui/Button";
import { Building2 } from "lucide-react";

export const revalidate = 300;
export const generateStaticParams = () => COUNTIES.map((c) => ({ slug: c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") }));

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const c = countyBySlug(params.slug);
  return c ? pageMeta(`Properties in ${c.name}`, `Houses, apartments, commercial space and land for rent or sale in ${c.name}, Kenya.`, `/locations/${params.slug}`) : { title: "Location not found" };
}

export default async function CountyPage({ params }: { params: { slug: string } }) {
  const c = countyBySlug(params.slug);
  if (!c) notFound();
  const idx = STATIC_INDEX();
  const subs = idx.subcounties(c.code);
  const areas = [...new Set(idx.areas(c.code).map((a) => a.name))].slice(0, 24);
  const { items, total } = await searchPublishedProperties({ county: c.code, availability: "available" }, 8);
  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Locations", href: "/locations" }, { label: c.name }]} />
      <h1 className="mt-4 font-heading text-3xl font-bold">Properties in {c.name}</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        <LinkButton href={`/rent?county=${c.code}`} size="sm">Rent in {c.name}</LinkButton>
        <LinkButton href={`/sale?county=${c.code}`} size="sm" variant="outline">Buy in {c.name}</LinkButton>
      </div>
      {!!subs.length && <section className="mt-8"><h2 className="font-heading text-lg font-semibold">Subcounties</h2><div className="mt-3 flex flex-wrap gap-2">{subs.map((s) => <Link key={s.id} href={`/search?county=${c.code}&q=${encodeURIComponent(s.name)}`} className="rounded border border-line bg-white px-3 py-1.5 text-sm hover:border-forest">{s.name}</Link>)}</div></section>}
      {!!areas.length && <section className="mt-8"><h2 className="font-heading text-lg font-semibold">Popular towns and estates</h2><div className="mt-3 flex flex-wrap gap-2">{areas.map((a) => <Link key={a} href={`/search?county=${c.code}&q=${encodeURIComponent(a)}`} className="rounded border border-line bg-white px-3 py-1.5 text-sm hover:border-forest">{a}</Link>)}</div></section>}
      <section className="mt-10"><h2 className="mb-4 font-heading text-lg font-semibold">Latest listings{total ? ` (${total})` : ""}</h2>
        {items.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{items.map((p) => <PropertyCard key={p.id} p={p} />)}</div> : <EmptyState icon={Building2} title={`No listings in ${c.name} yet`} message="Be the first to list a property here." action={<LinkButton href="/list-your-property">List your property</LinkButton>} />}
      </section>
    </div>
  );
}
