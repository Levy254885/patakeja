import { BadgeCheck, FlaskConical } from "lucide-react";
import { cn } from "@/lib/cn";

const tones = {
  neutral: "bg-ivory text-charcoal border-line",
  green: "bg-success/10 text-success border-success/20",
  gold: "bg-gold/15 text-[#7a6234] border-gold/30",
  red: "bg-danger/10 text-danger border-danger/20",
  amber: "bg-warning/10 text-[#8a5a00] border-warning/30",
  forest: "bg-forest text-white border-forest",
} as const;
export type Tone = keyof typeof tones;

export function Badge({ tone = "neutral", className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
  return <span className={cn("inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium", tones[tone], className)}>{children}</span>;
}

export const VerifiedBadge = ({ className }: { className?: string }) => (
  <Badge tone="green" className={className}><BadgeCheck className="h-3.5 w-3.5" aria-hidden />Verified</Badge>
);
/** Sample listings must always be labelled. */
export const DemoBadge = ({ className }: { className?: string }) => (
  <Badge tone="amber" className={className}><FlaskConical className="h-3.5 w-3.5" aria-hidden />Sample listing</Badge>
);

const statusTone: Record<string, Tone> = {
  published: "green", available: "green", success: "green", verified: "green", confirmed: "green", completed: "green", resolved: "green", active: "green",
  pending: "amber", "under-offer": "amber", open: "amber", new: "amber", draft: "neutral", archived: "neutral", closed: "neutral", cancelled: "neutral", none: "neutral",
  rejected: "red", failed: "red", declined: "red", rented: "red", sold: "red", contacted: "gold",
};
export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTone[status] ?? "neutral"} className="capitalize">{status.replace(/-/g, " ")}</Badge>;
}
