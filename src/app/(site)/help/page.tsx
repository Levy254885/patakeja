import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { ContentPage } from "@/components/content/ContentPage";
import { HelpSearch } from "@/components/content/HelpSearch";
import { listHelpArticlesServer } from "@/lib/server/firestore-rest";
import type { HelpArticle } from "@/lib/types";

export const metadata = pageMeta("Help centre", "Guides for tenants, landlords and agents using PataKeja.", "/help");
export const revalidate = 300;

export default async function HelpPage() {
  let articles: HelpArticle[] = [];
  try { articles = await listHelpArticlesServer(); } catch { /* empty state */ }
  return (
    <ContentPage title="Help centre" intro="Search our guides, or browse by topic." wide>
      <HelpSearch articles={articles.map(({ id, title, slug, category, body }) => ({ id, title, slug, category, body }))} />
      <p className="mt-10 text-sm text-muted">Still stuck? Read the <Link href="/faq" className="text-forest hover:underline">FAQs</Link> or <Link href="/contact" className="text-forest hover:underline">contact us</Link>.</p>
    </ContentPage>
  );
}
