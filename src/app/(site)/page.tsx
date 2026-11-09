import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, KeyRound, MapPin, Search, ShieldCheck, Smartphone } from "lucide-react";
import { getCategoriesServer, getFeaturedProperties, getPricingServer, searchPublishedProperties } from "@/lib/server/firestore-rest";
import { HeroSearch } from "@/components/home/HeroSearch";
import { PropertyCard } from "@/components/property/PropertyCard";
import { EmptyState } from "@/components/ui/States";
import { LinkButton } from "@/components/ui/Button";
import { COUNTIES } from "@/lib/locations";
import { slugify, formatKES } from "@/lib/format";
import { effectivePrice, mergePricing } from "@/lib/pricing";
import { pageMeta, TAGLINE } from "@/lib/seo";
import type { Property } from "@/lib/types";

export const revalidate = 300;
export const metadata: Metadata = pageMeta(`PataKeja | ${TAGLINE}`, "Find homes to rent or buy, commercial space and land across all 47 counties in Kenya. Contact landlords directly.", "/");

const FEATURED_COUNTIES = ["047", "001", "022", "032", "042", "016", "034", "027"];
const FAQ = [
  ["Is searching free?", "Yes. Browsing and searching are free. You only pay a small fee to unlock a landlord's phone number for a property you are interested in."],
  ["How do I pay?", "By M-Pesa. You get a prompt on your phone and enter your PIN. The contact is revealed as soon as the payment is confirmed."],
  ["How do I know a listing is genuine?", "Listings marked Verified have been checked by our team. You can also report any listing that looks wrong."],
];

function Section({ title, href, children, linkLabel = "View all" }: { title: string; href?: string; children: React.ReactNode; linkLabel?: string }) {
  return (
    <section className="container-page py-10 sm:py-14">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="font-heading text-2xl font-bold text-charcoal">{title}</h2>
        {href && <Link href={href} className="flex items-center gap-1 text-sm font-medium text-forest hover:underline">{linkLabel}<ArrowRight className="h-4 w-4" /></Link>}
      </div>
      {children}
    </section>
  );
}
const Grid = ({ items }: { items: Property[] }) => (
  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{items.map((p) => <PropertyCard key={p.id} p={p} />)}</div>
);

export default async function HomePage() {
  const [categories, featured, latest, rawPricing] = await Promise.all([getCategoriesServer(), getFeaturedProperties(8), searchPublishedProperties({ sort: "newest" }, 8), getPricingServer()]);
  const unlockFee = effectivePrice(mergePricing(rawPricing).contactAccess);
  const featuredIds = new Set(featured.map((p) => p.id));
  const recent = latest.items.filter((p) => !featuredIds.has(p.id)).slice(0, 8);
  const counties = FEATURED_COUNTIES.map((id) => COUNTIES.find((c) => c.code === id)!).filter(Boolean);

  return (
    <>
      <section className="bg-forest">
        <div className="container-page py-10 sm:py-16">
          <h1 className="max-w-2xl font-heading text-3xl font-extrabold leading-tight text-white sm:text-5xl">Find your place. Make your move.</h1>
          <p className="mt-3 max-w-xl text-base text-white/80">Homes to rent or buy, commercial space and land across all 47 counties. Search for free and contact landlords directly.</p>
          <div className="mt-8 max-w-5xl"><HeroSearch categories={categories.map((c) => ({ id: c.id, name: c.name, group: c.group }))} /></div>
        </div>
      </section>

      <Section title="Featured properties" href="/search">
        {featured.length ? <Grid items={featured} /> : <EmptyState icon={Building2} title="No featured properties yet" message="Hand-picked listings will appear here. Meanwhile, browse everything that is available." action={<LinkButton href="/search" variant="outline">Browse all listings</LinkButton>} />}
      </Section>

      <div className="bg-ivory/60">
        <Section title="Latest listings" href="/search">
          {recent.length ? <Grid items={recent} /> : <EmptyState icon={Search} title="No listings published yet" message="New properties show up here as soon as landlords publish them. Check back soon." action={<LinkButton href="/list-your-property">List your property</LinkButton>} />}
        </Section>
      </div>

      <Section title="Browse by type">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { href: "/rent", icon: KeyRound, t: "Rent a home", d: "Apartments, houses, bedsitters and more." },
            { href: "/sale", icon: Building2, t: "Buy a home", d: "Houses, apartments and plots for sale." },
            { href: "/commercial", icon: MapPin, t: "Commercial and land", d: "Offices, shops, warehouses and land." },
          ].map((x) => (
            <Link key={x.href} href={x.href} className="flex items-start gap-3 rounded border border-line bg-white p-4 hover:border-forest">
              <x.icon className="mt-0.5 h-5 w-5 text-forest" />
              <span><span className="block font-heading font-semibold text-charcoal">{x.t}</span><span className="text-sm text-muted">{x.d}</span></span>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Popular counties" href="/locations" linkLabel="All 47 counties">
        <div className="flex flex-wrap gap-2">
          {counties.map((c) => <Link key={c.code} href={`/locations/${slugify(c.name)}`} className="rounded border border-line bg-white px-4 py-2 text-sm text-charcoal hover:border-forest hover:text-forest">{c.name}</Link>)}
        </div>
      </Section>

      <div className="bg-ivory/60">
        <Section title="How it works">
          <ol className="grid gap-5 sm:grid-cols-3">
            {[
              { icon: Search, t: "1. Search for free", d: "Filter by county, town, price and type. Photos, prices and locations are always visible." },
              { icon: Smartphone, t: "2. Unlock the contact", d: `Pay ${formatKES(unlockFee)} by M-Pesa for each property whose landlord you want to reach.` },
              { icon: ShieldCheck, t: "3. Visit and decide", d: "Call or WhatsApp the landlord, book a viewing, and report anything that looks wrong." },
            ].map((s) => (
              <li key={s.t} className="rounded border border-line bg-white p-5">
                <s.icon className="h-6 w-6 text-forest" />
                <h3 className="mt-3 font-heading font-semibold text-charcoal">{s.t}</h3>
                <p className="mt-1 text-sm text-muted">{s.d}</p>
              </li>
            ))}
          </ol>
        </Section>
      </div>

      <section className="container-page py-10 sm:py-14">
        <div className="flex flex-col items-start justify-between gap-4 rounded bg-forest p-6 sm:flex-row sm:items-center sm:p-8">
          <div>
            <h2 className="font-heading text-2xl font-bold text-white">Own or manage property?</h2>
            <p className="mt-1 max-w-xl text-white/80">Reach tenants and buyers across Kenya. Create a listing, add photos and manage enquiries from one dashboard.</p>
          </div>
          <LinkButton href="/list-your-property" variant="gold" size="lg">List your property</LinkButton>
        </div>
      </section>

      <Section title="Common questions" href="/faq" linkLabel="All FAQs">
        <div className="grid gap-4 md:grid-cols-3">
          {FAQ.map(([q, a]) => <div key={q} className="rounded border border-line bg-white p-5"><h3 className="font-heading font-semibold text-charcoal">{q}</h3><p className="mt-1.5 text-sm text-muted">{a}</p></div>)}
        </div>
      </Section>
    </>
  );
}
