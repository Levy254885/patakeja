"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { Avatar } from "@/components/ui/Misc";
import { useAuth } from "@/context/AuthProvider";
import { cn } from "@/lib/cn";

export interface NavItem { href: string; label: string; icon: React.ComponentType<{ className?: string }>; exact?: boolean }

export function DashboardShell({ title, nav, children }: { title: string; nav: NavItem[]; children: React.ReactNode }) {
  const path = usePathname() ?? "";
  const { profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const active = (n: NavItem) => (n.exact ? path === n.href : path === n.href || path.startsWith(n.href + "/"));
  const list = (
    <nav className="space-y-0.5 p-3" aria-label={title}>
      {nav.map((n) => (
        <Link key={n.href} href={n.href} onClick={() => setOpen(false)} aria-current={active(n) ? "page" : undefined}
          className={cn("flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium", active(n) ? "bg-forest text-white" : "text-charcoal hover:bg-ivory")}>
          <n.icon className="h-4 w-4" />{n.label}
        </Link>
      ))}
    </nav>
  );
  return (
    <div className="min-h-screen bg-ivory">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col overflow-y-auto border-r border-line bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-line px-5"><Logo /></div>
        <div className="px-5 pt-4 text-xs font-semibold uppercase tracking-wide text-muted">{title}</div>
        {list}
      </aside>
      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-white px-4 sm:px-6">
          <button className="rounded p-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
          <span className="font-heading text-sm font-semibold text-charcoal lg:hidden">{title}</span>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/" className="hidden text-sm text-muted hover:text-forest sm:block">View site</Link>
            <Avatar name={profile?.fullName ?? "User"} src={profile?.photo?.url} size={34} />
            <button onClick={() => signOut()} className="flex items-center gap-1.5 rounded px-2 py-1.5 text-sm text-muted hover:bg-ivory hover:text-charcoal" aria-label="Sign out"><LogOut className="h-4 w-4" /><span className="hidden sm:inline">Sign out</span></button>
          </div>
        </header>
        <main className="mx-auto max-w-6xl p-4 sm:p-6">{children}</main>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 bg-charcoal/50 lg:hidden" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="h-full w-72 overflow-y-auto bg-white">
            <div className="flex h-16 items-center justify-between border-b border-line px-4"><Logo /><button onClick={() => setOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></button></div>
            {list}
          </div>
        </div>
      )}
    </div>
  );
}
