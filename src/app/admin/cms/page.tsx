"use client";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { PageHeader, Tabs } from "@/components/ui/Misc";
import { CrudManager } from "@/components/admin/common";
import { listFaqs, listHelpArticles, removeFaq, removeHelpArticle, saveFaq, saveHelpArticle } from "@/lib/services/admin";
import { slugify } from "@/lib/format";
import type { Faq, HelpArticle } from "@/lib/types";

const pub = (p: boolean) => <Badge tone={p ? "green" : "neutral"}>{p ? "Published" : "Draft"}</Badge>;

export default function AdminCmsPage() {
  const [tab, setTab] = useState<"articles" | "faqs">("articles");
  return (
    <div className="space-y-4">
      <PageHeader title="Help & FAQs" description="Content shown on the public Help and FAQ pages. Bodies are plain text; blank lines separate paragraphs." />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: "articles", label: "Help articles" }, { value: "faqs", label: "FAQs" }]} />
      {tab === "articles" ? (
        <CrudManager<HelpArticle> noun="article" load={listHelpArticles} search={(r) => [r.title, r.category]}
          columns={[
            { key: "order", header: "Order", render: (r) => r.order },
            { key: "title", header: "Title", render: (r) => <span className="font-medium">{r.title}</span> },
            { key: "category", header: "Category", render: (r) => r.category },
            { key: "pub", header: "Status", render: (r) => pub(r.published) },
          ]}
          fields={[
            { key: "title", label: "Title", required: true },
            { key: "category", label: "Category", required: true, hint: "e.g. Getting started, Payments, Safety" },
            { key: "body", label: "Body", type: "textarea", rows: 10, required: true },
            { key: "order", label: "Display order", type: "number" },
            { key: "published", label: "Published", type: "checkbox" },
          ]}
          blank={() => ({ title: "", category: "", body: "", order: 100, published: true })}
          save={async (v, ex) => saveHelpArticle({ id: ex?.id, title: String(v.title), slug: ex?.slug ?? (slugify(String(v.title)) || "article"), category: String(v.category), body: String(v.body), order: Number(v.order), published: Boolean(v.published) })}
          remove={(r) => removeHelpArticle(r.id)} />
      ) : (
        <CrudManager<Faq> noun="FAQ" load={listFaqs} search={(r) => [r.question, r.answer]}
          columns={[
            { key: "order", header: "Order", render: (r) => r.order },
            { key: "q", header: "Question", render: (r) => <span className="font-medium">{r.question}</span> },
            { key: "aud", header: "Audience", render: (r) => <span className="capitalize">{r.audience}</span> },
            { key: "pub", header: "Status", render: (r) => pub(r.published) },
          ]}
          fields={[
            { key: "question", label: "Question", required: true },
            { key: "answer", label: "Answer", type: "textarea", rows: 6, required: true },
            { key: "audience", label: "Audience", type: "select", options: [{ value: "all", label: "Everyone" }, { value: "tenants", label: "Tenants" }, { value: "landlords", label: "Landlords" }] },
            { key: "order", label: "Display order", type: "number" },
            { key: "published", label: "Published", type: "checkbox" },
          ]}
          blank={() => ({ question: "", answer: "", audience: "all", order: 100, published: true })}
          save={async (v, ex) => saveFaq({ id: ex?.id, question: String(v.question), answer: String(v.answer), audience: (v.audience as Faq["audience"]) || "all", order: Number(v.order), published: Boolean(v.published) })}
          remove={(r) => removeFaq(r.id)} />
      )}
    </div>
  );
}
