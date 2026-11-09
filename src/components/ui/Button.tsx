import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "gold" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-forest text-white hover:bg-forest/90",
  secondary: "bg-ivory text-charcoal hover:bg-ivory/70 border border-line",
  outline: "border border-forest text-forest hover:bg-forest/5",
  ghost: "text-charcoal hover:bg-ivory",
  gold: "bg-gold text-charcoal hover:bg-gold/90",
  danger: "bg-danger text-white hover:bg-danger/90",
};
const sizes: Record<Size, string> = { sm: "h-9 px-3 text-sm", md: "h-11 px-5 text-sm", lg: "h-12 px-6 text-base" };

interface Common { variant?: Variant; size?: Size; loading?: boolean; full?: boolean; className?: string; children?: React.ReactNode }
type ButtonProps = Common & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof Common>;
type LinkProps = Common & { href: string; target?: string; rel?: string };

const base = "inline-flex items-center justify-center gap-2 rounded font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest disabled:opacity-50 disabled:pointer-events-none";

export function Button({ variant = "primary", size = "md", loading, full, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button className={cn(base, variants[variant], sizes[size], full && "w-full", className)} disabled={disabled || loading} {...rest}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function LinkButton({ href, variant = "primary", size = "md", full, className, children, ...rest }: LinkProps) {
  return (
    <Link href={href} className={cn(base, variants[variant], sizes[size], full && "w-full", className)} {...rest}>
      {children}
    </Link>
  );
}
