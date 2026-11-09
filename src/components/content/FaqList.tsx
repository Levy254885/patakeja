"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Segmented } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/States";
import type { Faq } from "@/lib/types";

type Aud = "all" | "tenants" | "landlords";
export function FaqList({ faqs }: { faqs: Faq[] }) {
  const [aud, setAud] = useState<Aud>("all");
  const rows = faqs.filter((f) => aud === "all" || f.audience === aud || f.audience === "all");
  return (
    <div>
      <Segmented<Aud> value={aud} onChange={setAud} options={[{ value: "all", label: "All" }, { value: "tenants", label: "Tenants" }, { value: "landlords", label: "Landlords" }]} />
      <div className="mt-5 divide-y divide-line rounded border border-line bg-white">
        {rows.length === 0 && <EmptyState title="No questions here yet" />}
        {rows.map((f) => (
          <details key={f.id} className="group p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-charcoal">{f.question}<ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180" /></summary>
            <p className="mt-2 whitespace-pre-line text-sm text-muted">{f.answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
