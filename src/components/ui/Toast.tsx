"use client";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/cn";

type Kind = "success" | "error" | "info";
interface Toast { id: number; kind: Kind; message: string }
interface Api { success: (m: string) => void; error: (m: string) => void; info: (m: string) => void }
const Ctx = createContext<Api>({ success: () => {}, error: () => {}, info: () => {} });
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const dismiss = (id: number) => setItems((l) => l.filter((t) => t.id !== id));
  const push = useCallback((kind: Kind, message: string) => {
    const id = Date.now() + Math.random();
    setItems((l) => [...l.slice(-3), { id, kind, message }]);
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), kind === "error" ? 7000 : 4000);
  }, []);
  const api = useMemo<Api>(() => ({ success: (m) => push("success", m), error: (m) => push("error", m), info: (m) => push("info", m) }), [push]);
  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} role="status" className={cn("pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded border bg-white px-4 py-3 text-sm shadow-pop", t.kind === "error" ? "border-danger/40" : "border-line")}>
            {t.kind === "error" ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />}
            <span className="flex-1 text-charcoal">{t.message}</span>
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-muted hover:text-charcoal"><X className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
