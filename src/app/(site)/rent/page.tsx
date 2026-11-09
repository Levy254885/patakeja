import type { Metadata } from "next";
import { ListingsView } from "@/components/search/ListingsView";
import type { RawParams } from "@/components/search/params";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta("Houses and apartments for rent in Kenya", "Browse rental homes across all 47 counties. Search for free, then unlock the landlord's contact only for the places you want.", "/rent");

export default function Page({ searchParams }: { searchParams: RawParams }) {
  return <ListingsView title="Houses and apartments for rent in Kenya" description="Browse rental homes across all 47 counties. Search for free, then unlock the landlord's contact only for the places you want." basePath="/rent" sp={searchParams} fixed={{ listingType: "rent", group: "residential" }}  />;
}
