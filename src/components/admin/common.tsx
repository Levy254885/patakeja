"use client";
import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select, Checkbox, type Option } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, type Column } from "@/components/ui/Misc";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { useAsync, type AsyncState } from "@/hooks/useAsync";

export const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

/** Runs an async action, toasting success or failure. Resolves true on success. */
export function useAction() {
  const toast = useToast();
  return async (fn: () => Promise<unknown>, ok: string) => {
    try { await fn(); toast.success(ok); return true; } catch (e) { toast.error(errMsg(e)); return false; }
  };
}

export function downloadText(name: string, text: string, mime = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

/** Loading / error wrapper around a useAsync state. */
export function AsyncView<T>({ state, children }: { state: AsyncState<T>; children: (data: T) => React.ReactNode }) {
  if (state.loading && !state.data) return <div className="space-y-3"><Skeleton className="h-10" /><Skeleton className="h-40" /></div>;
  if (state.error && !state.data) return <ErrorState message={state.error} onRetry={state.reload} />;
  if (!state.data) return null;
  return <>{children(state.data)}</>;
}

export function SearchBox({ value, onChange, placeholder = "Search" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <Input aria-label={placeholder} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="w-full sm:max-w-xs" />;
}

export function matches(q: string, ...vals: (string | undefined | null)[]) {
  const s = q.trim().toLowerCase();
  return !s || vals.some((v) => (v ?? "").toLowerCase().includes(s));
}

// ------------------------------------------------------------------ generic CRUD list
export interface FieldDef { key: string; label: string; type?: "text" | "number" | "textarea" | "select" | "checkbox"; options?: Option[]; required?: boolean; hint?: string; rows?: number }

interface CrudProps<T extends { id: string }> {
  noun: string;
  load: () => Promise<T[]>;
  columns: Column<T>[];
  fields: FieldDef[];
  blank: () => Record<string, unknown>;
  save: (values: Record<string, unknown>, existing: T | null) => Promise<void>;
  remove?: (row: T) => Promise<void>;
  /** Shown when the collection is empty; may include a seed button. */
  emptyAction?: React.ReactNode;
  search?: (row: T) => string[];
  headerExtra?: React.ReactNode;
}

/** Table + add/edit modal + delete confirm for simple Firestore collections. */
export function CrudManager<T extends { id: string }>({ noun, load, columns, fields, blank, save, remove, emptyAction, search, headerExtra }: CrudProps<T>) {
  const state = useAsync(load, []);
  const run = useAction();
  const [editing, setEditing] = useState<T | "new" | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState<T | null>(null);
  const [q, setQ] = useState("");

  const open = (row: T | "new") => {
    setValues(row === "new" ? blank() : { ...(row as unknown as Record<string, unknown>) });
    setErrors({});
    setEditing(row);
  };
  const submit = async () => {
    const errs: Record<string, string> = {};
    for (const f of fields) {
      const v = values[f.key];
      if (f.required && (v === undefined || v === null || String(v).trim() === "")) errs[f.key] = `${f.label} is required`;
      if (f.type === "number" && v !== undefined && v !== "" && Number.isNaN(Number(v))) errs[f.key] = "Enter a number";
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const out: Record<string, unknown> = { ...values };
    for (const f of fields) {
      if (f.type === "number") out[f.key] = Number(out[f.key] ?? 0);
      else if (f.type === "checkbox") out[f.key] = Boolean(out[f.key]);
      else if (typeof out[f.key] === "string") out[f.key] = (out[f.key] as string).trim();
    }
    setSaving(true);
    const ok = await run(() => save(out, editing === "new" ? null : (editing as T)), `${noun} saved`);
    setSaving(false);
    if (ok) { setEditing(null); state.reload(); }
  };

  const cols: Column<T>[] = [
    ...columns,
    {
      key: "_actions", header: "", className: "w-24 text-right",
      render: (r) => (
        <div className="flex justify-end gap-1">
          <button className="rounded p-2 text-muted hover:bg-ivory hover:text-charcoal" aria-label={`Edit ${noun}`} onClick={() => open(r)}><Pencil className="h-4 w-4" /></button>
          {remove && <button className="rounded p-2 text-muted hover:bg-ivory hover:text-danger" aria-label={`Delete ${noun}`} onClick={() => setDel(r)}><Trash2 className="h-4 w-4" /></button>}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {search ? <SearchBox value={q} onChange={setQ} /> : <span />}
        <div className="flex gap-2">{headerExtra}<Button size="sm" onClick={() => open("new")}><Plus className="h-4 w-4" />Add {noun}</Button></div>
      </div>
      <AsyncView state={state}>
        {(rows) => {
          const shown = search ? rows.filter((r) => matches(q, ...search(r))) : rows;
          return (
            <DataTable rows={shown} columns={cols} rowKey={(r) => r.id}
              empty={<EmptyState title={rows.length ? "No matches" : `No ${noun} records yet`} message={rows.length ? "Try a different search." : `Add the first ${noun} to get started.`} action={!rows.length ? emptyAction : undefined} />} />
          );
        }}
      </AsyncView>
      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? `Add ${noun}` : `Edit ${noun}`}
        footer={<><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button loading={saving} onClick={submit}>Save</Button></>}>
        <div className="space-y-4">
          {fields.map((f) => {
            const v = values[f.key];
            const set = (x: unknown) => setValues((s) => ({ ...s, [f.key]: x }));
            if (f.type === "checkbox") return <Checkbox key={f.key} label={f.label} checked={Boolean(v)} onChange={(e) => set(e.target.checked)} />;
            if (f.type === "textarea") return <Textarea key={f.key} label={f.label} hint={f.hint} error={errors[f.key]} rows={f.rows ?? 5} value={String(v ?? "")} onChange={(e) => set(e.target.value)} />;
            if (f.type === "select") return <Select key={f.key} label={f.label} hint={f.hint} error={errors[f.key]} options={f.options ?? []} value={String(v ?? "")} onChange={(e) => set(e.target.value)} />;
            return <Input key={f.key} label={f.label} hint={f.hint} error={errors[f.key]} type={f.type === "number" ? "number" : "text"} value={String(v ?? "")} onChange={(e) => set(e.target.value)} />;
          })}
        </div>
      </Modal>
      <ConfirmDialog open={!!del} danger title={`Delete ${noun}?`} message="This cannot be undone." confirmLabel="Delete" onClose={() => setDel(null)}
        onConfirm={async () => { if (del && remove) { const ok = await run(() => remove(del), `${noun} deleted`); if (ok) state.reload(); } }} />
    </div>
  );
}

/** Memoised map helper for lookups. */
export const useIndex = <T,>(rows: T[] | null | undefined, key: (r: T) => string) => useMemo(() => new Map((rows ?? []).map((r) => [key(r), r])), [rows]); // eslint-disable-line react-hooks/exhaustive-deps
