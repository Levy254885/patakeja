"use client";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-muted">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5" aria-hidden />}
          {it.href ? <Link href={it.href} className="hover:text-primary">{it.label}</Link> : <span className="text-charcoal">{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function Avatar({ name, src, size = 40, className }: { name: string; src?: string; size?: number; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return src ? <img src={src} alt={name} width={size} height={size} className={cn("shrink-0 rounded-full object-cover", className)} style={{ width: size, height: size }} />
    : <span aria-label={name} className={cn("flex shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white", className)} style={{ width: size, height: size }}>{initials(name)}</span>;
}

export function Tabs<T extends string>({ value, onChange, tabs, className }: { value: T; onChange: (v: T) => void; tabs: { value: T; label: string; count?: number }[]; className?: string }) {
  return (
    <div role="tablist" className={cn("flex gap-1 overflow-x-auto border-b border-line", className)}>
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)}
          className={cn("-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium", value === t.value ? "border-primary text-primary" : "border-transparent text-muted hover:text-charcoal")}>
          {t.label}{t.count !== undefined && <span className="ml-1.5 rounded bg-surface px-1.5 py-0.5 text-xs">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

type MetricTone = "plain" | "primary" | "blue" | "green" | "amber" | "red" | "violet" | "pink" | "teal";
const iconTone: Record<MetricTone, string> = { plain: "bg-surface text-primary", primary: "bg-white/20 text-white", blue: "bg-primary-50 text-primary", green: "bg-success-50 text-success", amber: "bg-accent-50 text-accent-600", red: "bg-danger-50 text-danger", violet: "bg-violet-50 text-violet", pink: "bg-pink-50 text-pink", teal: "bg-teal-50 text-teal" };

/** Stat tile (Zenrent style): tinted icon square, optional trend chip, big value. `tone="primary"` gives the solid blue hero tile. */
export function MetricCard({ label, value, hint, icon: Icon, tone = "plain", trend }: { label: string; value: React.ReactNode; hint?: string; icon?: React.ComponentType<{ className?: string }>; tone?: MetricTone; trend?: { text: string; good?: boolean } }) {
  const solid = tone === "primary";
  return (
    <div className={cn("rounded-2xl border p-4 sm:p-5", solid ? "border-primary bg-primary text-white" : "border-line bg-white")}>
      <div className="flex items-start justify-between gap-2">
        {Icon ? <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", iconTone[tone])}><Icon className="h-5 w-5" /></span> : <span />}
        {trend && <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", solid ? "bg-white/20 text-white" : trend.good === false ? "bg-danger-50 text-danger" : "bg-success-50 text-success")}>{trend.text}</span>}
      </div>
      <p className={cn("mt-4 text-sm", solid ? "text-white/80" : "text-muted")}>{label}</p>
      <p className="mt-1 font-heading text-2xl font-extrabold">{value}</p>
      {hint && <p className={cn("mt-1 text-xs", solid ? "text-white/70" : "text-muted")}>{hint}</p>}
    </div>
  );
}

export function Card({ title, action, children, className }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("min-w-0 max-w-full overflow-hidden rounded-2xl border border-line bg-white", className)}>
      {(title || action) && <header className="flex items-center justify-between border-b border-line px-5 py-3.5"><h2 className="font-heading text-base font-semibold text-charcoal">{title}</h2>{action}</header>}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="font-heading text-2xl font-bold text-charcoal">{title}</h1>{description && <p className="mt-1 text-sm text-muted">{description}</p>}</div>
      {action}
    </div>
  );
}

export interface Column<T> { key: string; header: string; render: (row: T) => React.ReactNode; className?: string }
export function DataTable<T>({ rows, columns, rowKey, empty }: { rows: T[]; columns: Column<T>[]; rowKey: (r: T) => string; empty?: React.ReactNode }) {
  if (!rows.length) return <>{empty}</>;
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-line bg-surface text-xs uppercase tracking-wide text-muted">
          <tr>{columns.map((c) => <th key={c.key} className={cn("px-4 py-3 font-medium", c.className)}>{c.header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r) => <tr key={rowKey(r)} className="hover:bg-surface/50">{columns.map((c) => <td key={c.key} className={cn("px-4 py-3 align-middle", c.className)}>{c.render(r)}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}
