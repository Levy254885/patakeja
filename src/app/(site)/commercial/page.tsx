import type { Metadata } from "next";
import { ListingsView } from "@/components/search/ListingsView";
import type { RawParams } from "@/components/search/params";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta("Commercial property in Kenya", "Offices, shops, warehouses and commercial buildings to rent or buy.", "/commercial");

export default function Page({ searchParams }: { searchParams: RawParams }) {
  return <ListingsView title="Commercial property in Kenya" description="Offices, shops, warehouses and commercial buildings to rent or buy." basePath="/commercial" sp={searchParams} fixed={{ group: "commercial" }} showType />;
}
