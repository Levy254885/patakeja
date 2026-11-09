"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, Search, UserRound } from "lucide-react";
import { useAuth } from "@/context/AuthProvider";
import { dashboardPathFor } from "@/lib/nav";
import { cn } from "@/lib/cn";

export function MobileTabBar() {
  const path = usePathname();
  const { role, user } = useAuth();
  const tabs = [
    { href: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
    { href: "/rent", label: "Explore", icon: Search, match: (p: string) => /^\/(rent|sale|commercial|land|search|locations)/.test(p) },
    { href: user ? "/account/saved" : "/login?next=/account/saved", label: "Saved", icon: Heart, match: (p: string) => p.startsWith("/account/saved") },
    { href: user ? dashboardPathFor(role) : "/login", label: "Account", icon: UserRound, match: (p: string) => /^\/(account|portal|admin|login|register)/.test(p) && !p.startsWith("/account/saved") },
  ];
  if (/^\/(admin|portal|account)/.test(path ?? "")) return null; // dashboards use their own mobile navigation
  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="grid grid-cols-4">
        {tabs.map((t) => {
          const active = t.match(path ?? "");
          return <li key={t.label}><Link href={t.href} aria-current={active ? "page" : undefined} className={cn("flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium", active ? "text-forest" : "text-muted")}><t.icon className="h-5 w-5" />{t.label}</Link></li>;
        })}
      </ul>
    </nav>
  );
}
