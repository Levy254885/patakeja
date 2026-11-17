import { notFound } from "next/navigation";
import { pageMeta } from "@/lib/seo";
import { ContentPage, prose } from "@/components/content/ContentPage";
import { listHelpArticlesServer } from "@/lib/server/firestore-rest";
import type { HelpArticle } from "@/lib/types";

export const revalidate = 300;

async function find(slug: string): Promise<HelpArticle | undefined> {
  try { return (await listHelpArticlesServer()).find((a) => a.slug === slug); } catch { return undefined; }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const a = await find(params.slug);
  return a ? pageMeta(a.title, a.body.slice(0, 150), `/help/${a.slug}`) : pageMeta("Help article", "PataKeja help centre", "/help");
}

export default async function HelpArticlePage({ params }: { params: { slug: string } }) {
  const a = await find(params.slug);
  if (!a) notFound();
  return (
    <ContentPage title={a.title} crumbs={[{ label: "Help centre", href: "/help" }]}>
      <div className={`${prose} whitespace-pre-line`}>{a.body}</div>
    </ContentPage>
  );
}
