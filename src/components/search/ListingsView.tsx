import Link from "next/link";
import { SearchX } from "lucide-react";
import { getCategoriesServer, PAGE_SIZE, searchPublishedProperties } from "@/lib/server/firestore-rest";
import { PropertyCard } from "@/components/property/PropertyCard";
import { Pagination } from "@/components/ui/Pagination";
import { Breadcrumbs } from "@/components/ui/Misc";
import { EmptyState } from "@/components/ui/States";
import { LinkButton } from "@/components/ui/Button";
import type { PanelProps } from "./FilterPanel";
import { FilterBar } from "./FilterBar";
import { MapSplit } from "./MapSplit";
import { parseFilters, rawFilters, toQuery, type Fixed, type RawParams } from "./params";

interface Props {
  title: string;
  description: string;
  basePath: string;
  sp: RawParams;
  fixed?: Fixed;
  showType?: boolean;
  showGroup?: boolean;
  showQuery?: boolean;
  crumbs?: { label: string; href?: string }[];
}

/** Server-rendered listings page shared by /rent, /sale, /commercial, /land and /search. */
export async function ListingsView({ title, description, basePath, sp, fixed = {}, showType, showGroup, showQuery, crumbs }: Props) {
  const filters = parseFilters(sp, fixed);
  const raw = rawFilters(sp);
  const map = raw.view === "map";
  const [categories, { items, total }] = await Promise.all([getCategoriesServer(), searchPublishedProperties(filters, map ? 60 : PAGE_SIZE)]);
  const pages = map ? 1 : Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(filters.page ?? 1, pages);
  const panel: PanelProps = {
    basePath, raw, fixed, showType, showGroup, showQuery,
    categories: categories.map((c) => ({ id: c.id, name: c.name, group: c.group })),
  };
  const hrefFor = (p: number) => `${basePath}${toQuery({ ...raw, page: p > 1 ? String(p) : undefined })}`;
  const filtered = Object.keys(raw).some((k) => k !== "sort" && k !== "view");

  return (
    <div className="container-page py-6 sm:py-8">
      <div className="rounded-2xl border border-line bg-white p-4 shadow-card sm:p-6">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, ...(crumbs ?? [{ label: title }])]} />
        <header className="mb-5 mt-3">
          <h1 className="font-heading text-2xl font-bold text-charcoal sm:text-3xl">{title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>
        </header>
        <FilterBar key={JSON.stringify(raw)} panel={panel} total={total} />
        <section aria-label="Results" className="mt-5">
          {items.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title={filtered ? "No listings match these filters" : "No listings here yet"}
              message={filtered ? "Try widening your price range, choosing another area or clearing some filters." : "New properties are added by landlords and agents every day. Check back soon, or list one yourself."}
              action={filtered ? <LinkButton href={basePath} variant="outline">Clear filters</LinkButton> : <LinkButton href="/list-your-property" variant="outline">List your property</LinkButton>}
            />
          ) : map ? (
            <MapSplit items={items} />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{items.map((p) => <PropertyCard key={p.id} p={p} />)}</div>
              <Pagination page={page} pages={pages} hrefFor={hrefFor} />
            </>
          )}
        </section>
      </div>
      <p className="mt-6 text-xs text-muted">Looking somewhere specific? <Link href="/locations" className="text-primary underline">Browse by county</Link>.</p>
    </div>
  );
}
