import type { DocumentSnapshot, QueryDocumentSnapshot } from "firebase/firestore";

/** Recursively convert Firestore Timestamps to epoch milliseconds so every document is plain JSON. */
export function toPlain<T = unknown>(value: unknown): T {
  if (value === null || value === undefined) return value as T;
  if (Array.isArray(value)) return value.map((v) => toPlain(v)) as unknown as T;
  if (typeof value === "object") {
    const v = value as { toMillis?: () => number };
    if (typeof v.toMillis === "function") return v.toMillis() as unknown as T;
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(value as Record<string, unknown>)) out[k] = toPlain(val);
    return out as T;
  }
  return value as T;
}

/** Document snapshot -> `{ id, ...data }` or null when it does not exist. */
export function fromSnap<T extends { id: string }>(snap: DocumentSnapshot): T | null {
  if (!snap.exists()) return null;
  return { ...toPlain<Record<string, unknown>>(snap.data()), id: snap.id } as unknown as T;
}

export function fromSnaps<T extends { id: string }>(docs: QueryDocumentSnapshot[]): T[] {
  return docs.map((d) => ({ ...toPlain<Record<string, unknown>>(d.data()), id: d.id }) as unknown as T);
}

/** Firestore rejects `undefined`; strip it (and keep nulls) before writing. */
export function clean<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    if (v && typeof v === "object" && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype) out[k] = clean(v as Record<string, unknown>);
    else out[k] = v;
  }
  return out as T;
}
