"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, UserRound, X } from "lucide-react";
import { Logo } from "./Logo";
import { LinkButton } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthProvider";
import { dashboardPathFor } from "@/lib/nav";

const links = [
  { href: "/rent", label: "Rent" },
  { href: "/sale", label: "Buy" },
  { href: "/commercial", label: "Commercial" },
  { href: "/land", label: "Land" },
  { href: "/agents", label: "Agents" },
  { href: "/help", label: "Help" },
];

export function SiteHeader() {
  const { user, role, profile, loading } = useAuth();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Main">
          {links.map((l) => <Link key={l.href} href={l.href} className="text-sm font-medium text-charcoal hover:text-forest">{l.label}</Link>)}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <LinkButton href="/list-your-property" variant="outline" size="sm">List your property</LinkButton>
          {!loading && (user
            ? <LinkButton href={dashboardPathFor(role)} size="sm"><UserRound className="h-4 w-4" />{profile?.fullName?.split(" ")[0] ?? "Account"}</LinkButton>
            : <><LinkButton href="/login" variant="ghost" size="sm">Log in</LinkButton><LinkButton href="/register" size="sm">Sign up</LinkButton></>)}
        </div>
        <button className="rounded p-2 lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
      </div>
      {open && (
        <nav className="border-t border-line bg-white px-4 py-3 lg:hidden" aria-label="Mobile">
          {links.map((l) => <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block py-2.5 text-sm font-medium">{l.label}</Link>)}
          <div className="mt-2 flex gap-2">
            <LinkButton href="/list-your-property" variant="outline" size="sm" className="flex-1">List property</LinkButton>
            {user ? <LinkButton href={dashboardPathFor(role)} size="sm" className="flex-1">Dashboard</LinkButton> : <LinkButton href="/login" size="sm" className="flex-1">Log in</LinkButton>}
          </div>
        </nav>
      )}
    </header>
  );
}
