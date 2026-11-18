import { pageMeta } from "@/lib/seo";
import { ContentPage } from "@/components/content/ContentPage";
import { FaqList } from "@/components/content/FaqList";
import { DEFAULT_FAQS } from "@/lib/content/faqs";
import { listFaqsServer } from "@/lib/server/firestore-rest";
import type { Faq } from "@/lib/types";

export const metadata = pageMeta("Frequently asked questions", "Answers about searching, unlocking contacts, listing and payments on PataKeja.", "/faq");
export const revalidate = 300;

export default async function FaqPage() {
  let faqs: Faq[] = [];
  try { faqs = await listFaqsServer(); } catch { /* fall back to defaults */ }
  if (!faqs.length) faqs = DEFAULT_FAQS;
  return (
    <ContentPage title="FAQs" intro="Quick answers to common questions.">
      <FaqList faqs={faqs} />
    </ContentPage>
  );
}
