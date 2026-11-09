import type { Metadata } from "next";
import { ListingsView } from "@/components/search/ListingsView";
import type { RawParams } from "@/components/search/params";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta("Search properties in Kenya", "Search homes, commercial space and land to rent or buy across all 47 counties.", "/search", { noindex: true });

export default function Page({ searchParams }: { searchParams: RawParams }) {
  return <ListingsView title="Search properties" description="Filter by type, location, price and bedrooms." basePath="/search" sp={searchParams} showType showGroup showQuery />;
}
