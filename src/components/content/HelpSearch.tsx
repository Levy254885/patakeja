"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/States";
import type { HelpArticle } from "@/lib/types";

export function HelpSearch({ articles }: { articles: Pick<HelpArticle, "id" | "title" | "slug" | "category" | "body">[] }) {
  const [q, setQ] = useState("");
  const groups = useMemo(() => {
    const t = q.trim().toLowerCase();
    const list = t ? articles.filter((a) => (a.title + " " + a.body + " " + a.category).toLowerCase().includes(t)) : articles;
    const m = new Map<string, typeof list>();
    list.forEach((a) => m.set(a.category || "General", [...(m.get(a.category || "General") ?? []), a]));
    return Array.from(m.entries());
  }, [q, articles]);
  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted" />
        <Input aria-label="Search help articles" placeholder="Search help articles" value={q} onChange={(e) => setQ(e.target.value)} className="[&_input]:pl-9" style={{ }} />
      </div>
      {groups.length === 0 ? <div className="mt-6"><EmptyState title={q ? "No matching articles" : "No help articles yet"} message={q ? "Try different words, or contact support." : "Check the FAQs or contact support in the meantime."} /></div> : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {groups.map(([cat, items]) => (
            <section key={cat}>
              <h2 className="font-heading text-base font-semibold text-charcoal">{cat}</h2>
              <ul className="mt-2 space-y-1.5 text-sm">{items.map((a) => <li key={a.id}><Link href={`/help/${a.slug}`} className="text-forest hover:underline">{a.title}</Link></li>)}</ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
