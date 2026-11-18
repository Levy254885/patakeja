import type { Metadata } from "next";
import { ListingsView } from "@/components/search/ListingsView";
import type { RawParams } from "@/components/search/params";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta("Land for sale in Kenya", "Residential, agricultural and commercial plots across Kenya.", "/land");

export default function Page({ searchParams }: { searchParams: RawParams }) {
  return <ListingsView title="Land for sale in Kenya" description="Residential, agricultural and commercial plots across Kenya." basePath="/land" sp={searchParams} fixed={{ group: "land" }} showType />;
}
