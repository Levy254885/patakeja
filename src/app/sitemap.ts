import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { COUNTIES } from "@/lib/locations";
import { slugify } from "@/lib/format";
import { listAllPublishedIds } from "@/lib/server/firestore-rest";

export const revalidate = 3600;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const statics = ["", "/rent", "/sale", "/commercial", "/land", "/locations", "/agents", "/list-your-property", "/about", "/contact", "/help", "/faq", "/privacy", "/terms"].map((p) => ({ url: `${SITE_URL}${p}`, lastModified: now }));
  const counties = COUNTIES.map((c) => ({ url: `${SITE_URL}/locations/${slugify(c.name)}`, lastModified: now }));
  const props = (await listAllPublishedIds()).map((p) => ({ url: `${SITE_URL}/property/${p.slug ?? p.id}`, lastModified: p.updatedAt ? new Date(p.updatedAt) : now }));
  return [...statics, ...counties, ...props];
}
