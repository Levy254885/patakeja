"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { Avatar } from "@/components/ui/Misc";
import { LinkButton } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthProvider";
import { dashboardPathFor } from "@/lib/nav";
import { cn } from "@/lib/cn";

const links = [
  { href: "/rent", label: "Rent" },
  { href: "/sale", label: "Buy" },
  { href: "/commercial", label: "Commercial" },
  { href: "/land", label: "Land" },
  { href: "/agents", label: "Agents" },
  { href: "/help", label: "Help" },
];

const pill = "rounded-full border px-5 py-2 text-sm font-medium transition-colors";

export function SiteHeader() {
  const { user, role, profile, loading } = useAuth();
  const path = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const active = (href: string) => path === href || path.startsWith(href + "/");
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-2 lg:flex" aria-label="Main">
          {links.map((l) => (
            <Link key={l.href} href={l.href} aria-current={active(l.href) ? "page" : undefined}
              className={cn(pill, active(l.href) ? "border-primary bg-primary text-white" : "border-line text-charcoal hover:border-primary hover:text-primary")}>{l.label}</Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/list-your-property" className={cn(pill, "border-line text-charcoal hover:border-primary hover:text-primary")}>List your property</Link>
          {!loading && (user ? (
            <>
              <Link href="/account/notifications" aria-label="Notifications" className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-charcoal hover:border-primary"><Bell className="h-[18px] w-[18px]" /></Link>
              <Link href={dashboardPathFor(role)} aria-label="My account"><Avatar name={profile?.fullName ?? "Account"} src={profile?.photo?.url} size={40} className="rounded-xl" /></Link>
            </>
          ) : (
            <><Link href="/login" className="text-sm font-medium text-charcoal hover:text-primary">Log in</Link><LinkButton href="/register" size="sm" className="rounded-full px-5">Sign up</LinkButton></>
          ))}
        </div>
        <button className="rounded-xl border border-line p-2.5 lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
      </div>
      {open && (
        <nav className="border-t border-line bg-white px-4 py-4 lg:hidden" aria-label="Mobile">
          <div className="flex flex-wrap gap-2">
            {links.map((l) => <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={cn(pill, active(l.href) ? "border-primary bg-primary text-white" : "border-line")}>{l.label}</Link>)}
          </div>
          <div className="mt-4 flex gap-2">
            <LinkButton href="/list-your-property" variant="outline" size="sm" className="flex-1 rounded-full">List property</LinkButton>
            {user ? <LinkButton href={dashboardPathFor(role)} size="sm" className="flex-1 rounded-full">Dashboard</LinkButton> : <LinkButton href="/login" size="sm" className="flex-1 rounded-full">Log in</LinkButton>}
          </div>
        </nav>
      )}
    </header>
  );
}
