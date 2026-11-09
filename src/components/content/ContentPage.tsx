import { Breadcrumbs } from "@/components/ui/Misc";

export function ContentPage({ title, intro, crumbs, children, wide }: { title: string; intro?: string; crumbs?: { label: string; href?: string }[]; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`mx-auto px-4 py-8 sm:px-6 sm:py-12 ${wide ? "max-w-5xl" : "max-w-3xl"}`}>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, ...(crumbs ?? []), { label: title }]} />
      <h1 className="mt-4 font-heading text-3xl font-semibold text-charcoal">{title}</h1>
      {intro && <p className="mt-3 text-base text-muted">{intro}</p>}
      <div className="mt-8">{children}</div>
    </div>
  );
}

export function LegalDraftNotice() {
  return (
    <div className="mb-6 rounded border border-warning/40 bg-warning/10 p-4 text-sm text-charcoal" role="note">
      <strong>Draft - needs legal review.</strong> This text is a working draft and has not been reviewed by a lawyer. It must be reviewed before launch.
    </div>
  );
}

export const prose = "space-y-3 text-sm leading-relaxed text-charcoal [&_h2]:mt-8 [&_h2]:font-heading [&_h2]:text-lg [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5";
