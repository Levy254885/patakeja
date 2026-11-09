"use client";
import { useId } from "react";
import { cn } from "@/lib/cn";

const control = "w-full rounded border border-line bg-white px-3 text-sm text-charcoal placeholder:text-muted focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest disabled:bg-ivory disabled:text-muted";

interface FieldShell { label?: string; hint?: string; error?: string; required?: boolean; className?: string }

function Shell({ id, label, hint, error, required, className, children }: FieldShell & { id: string; children: React.ReactNode }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-charcoal">
          {label}{required && <span className="text-danger" aria-hidden> *</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && <p className="text-xs text-danger" role="alert">{error}</p>}
    </div>
  );
}

type InputProps = FieldShell & Omit<React.InputHTMLAttributes<HTMLInputElement>, "className">;
export function Input({ label, hint, error, className, required, ...rest }: InputProps) {
  const id = useId();
  return (
    <Shell id={id} {...{ label, hint, error, required, className }}>
      <input id={id} required={required} aria-invalid={!!error} className={cn(control, "h-11", error && "border-danger")} {...rest} />
    </Shell>
  );
}

type TextareaProps = FieldShell & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "className">;
export function Textarea({ label, hint, error, className, required, rows = 4, ...rest }: TextareaProps) {
  const id = useId();
  return (
    <Shell id={id} {...{ label, hint, error, required, className }}>
      <textarea id={id} rows={rows} required={required} aria-invalid={!!error} className={cn(control, "py-2.5", error && "border-danger")} {...rest} />
    </Shell>
  );
}

export interface Option { value: string; label: string }
type SelectProps = FieldShell & { options: Option[]; placeholder?: string } & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "className">;
export function Select({ label, hint, error, className, required, options, placeholder, ...rest }: SelectProps) {
  const id = useId();
  return (
    <Shell id={id} {...{ label, hint, error, required, className }}>
      <select id={id} required={required} aria-invalid={!!error} className={cn(control, "h-11", error && "border-danger")} {...rest}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Shell>
  );
}

export function Checkbox({ label, className, ...rest }: { label: React.ReactNode; className?: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "className">) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-2.5 text-sm text-charcoal", className)}>
      <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-line accent-forest" {...rest} />
      <span>{label}</span>
    </label>
  );
}

export function Segmented<T extends string>({ value, onChange, options, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; className?: string }) {
  return (
    <div role="tablist" className={cn("inline-flex rounded border border-line bg-ivory p-0.5", className)}>
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)}
          className={cn("rounded px-4 py-2 text-sm font-medium transition-colors", value === o.value ? "bg-forest text-white" : "text-charcoal hover:bg-white")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
