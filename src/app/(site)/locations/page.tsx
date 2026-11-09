import Link from "next/link";
import { COUNTIES } from "@/lib/locations";
import { slugify } from "@/lib/format";
import { pageMeta } from "@/lib/seo";
import { Breadcrumbs } from "@/components/ui/Misc";
import { MapPin } from "lucide-react";

export const metadata = pageMeta("Browse properties by county", "Find homes, commercial space and land in all 47 counties of Kenya.", "/locations");

export default function LocationsPage() {
  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Locations" }]} />
      <h1 className="mt-4 font-heading text-3xl font-bold">Browse by county</h1>
      <p className="mt-2 text-muted">All 47 counties. Pick one to see towns, estates and listings.</p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {COUNTIES.map((c) => <li key={c.code}><Link href={`/locations/${slugify(c.name)}`} className="flex items-center gap-2 rounded border border-line bg-white px-4 py-3 text-sm font-medium hover:border-forest"><MapPin className="h-4 w-4 text-forest" />{c.name}</Link></li>)}
      </ul>
    </div>
  );
}
