import Link from "next/link";
import { cn } from "@/lib/cn";
export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2 font-heading text-xl font-extrabold tracking-tight", light ? "text-white" : "text-primary", className)} aria-label="PataKeja home">
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden><rect width="26" height="26" rx="7" fill={light ? "#F2A33A" : "#1D5FD8"} /><path d="M6 13.2 13 7l7 6.2V20h-4.5v-4.5h-5V20H6v-6.8Z" fill={light ? "#1D5FD8" : "#F4F1E9"} /></svg>
      <span>Pata<span className="text-accent">Keja</span></span>
    </Link>
  );
}
