import type { Metadata } from "next";
import { ListingsView } from "@/components/search/ListingsView";
import type { RawParams } from "@/components/search/params";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta("Houses and apartments for sale in Kenya", "Homes for sale across Kenya, listed directly by owners and agents.", "/sale");

export default function Page({ searchParams }: { searchParams: RawParams }) {
  return <ListingsView title="Houses and apartments for sale in Kenya" description="Homes for sale across Kenya, listed directly by owners and agents." basePath="/sale" sp={searchParams} fixed={{ listingType: "sale", group: "residential" }}  />;
}
