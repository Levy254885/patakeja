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
          {it.href ? <Link href={it.href} className="hover:text-forest">{it.label}</Link> : <span className="text-charcoal">{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function Avatar({ name, src, size = 40, className }: { name: string; src?: string; size?: number; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return src ? <img src={src} alt={name} width={size} height={size} className={cn("shrink-0 rounded-full object-cover", className)} style={{ width: size, height: size }} />
    : <span aria-label={name} className={cn("flex shrink-0 items-center justify-center rounded-full bg-forest text-xs font-semibold text-white", className)} style={{ width: size, height: size }}>{initials(name)}</span>;
}

export function Tabs<T extends string>({ value, onChange, tabs, className }: { value: T; onChange: (v: T) => void; tabs: { value: T; label: string; count?: number }[]; className?: string }) {
  return (
    <div role="tablist" className={cn("flex gap-1 overflow-x-auto border-b border-line", className)}>
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)}
          className={cn("-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium", value === t.value ? "border-forest text-forest" : "border-transparent text-muted hover:text-charcoal")}>
          {t.label}{t.count !== undefined && <span className="ml-1.5 rounded bg-ivory px-1.5 py-0.5 text-xs">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function MetricCard({ label, value, hint, icon: Icon }: { label: string; value: React.ReactNode; hint?: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded border border-line bg-white p-4">
      <div className="flex items-center justify-between text-sm text-muted">{label}{Icon && <Icon className="h-4 w-4 text-forest" />}</div>
      <div className="mt-2 font-heading text-2xl font-semibold text-charcoal">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}

export function Card({ title, action, children, className }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded border border-line bg-white", className)}>
      {(title || action) && <header className="flex items-center justify-between border-b border-line px-5 py-3.5"><h2 className="font-heading text-base font-semibold text-charcoal">{title}</h2>{action}</header>}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="font-heading text-2xl font-semibold text-charcoal">{title}</h1>{description && <p className="mt-1 text-sm text-muted">{description}</p>}</div>
      {action}
    </div>
  );
}

export interface Column<T> { key: string; header: string; render: (row: T) => React.ReactNode; className?: string }
export function DataTable<T>({ rows, columns, rowKey, empty }: { rows: T[]; columns: Column<T>[]; rowKey: (r: T) => string; empty?: React.ReactNode }) {
  if (!rows.length) return <>{empty}</>;
  return (
    <div className="overflow-x-auto rounded border border-line bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-line bg-ivory text-xs uppercase tracking-wide text-muted">
          <tr>{columns.map((c) => <th key={c.key} className={cn("px-4 py-3 font-medium", c.className)}>{c.header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r) => <tr key={rowKey(r)} className="hover:bg-ivory/50">{columns.map((c) => <td key={c.key} className={cn("px-4 py-3 align-middle", c.className)}>{c.render(r)}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}
