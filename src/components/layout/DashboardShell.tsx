"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bell, ExternalLink, LogOut, Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { Avatar } from "@/components/ui/Misc";
import { useAuth } from "@/context/AuthProvider";
import { cn } from "@/lib/cn";

export interface NavItem { href: string; label: string; icon: React.ComponentType<{ className?: string }>; exact?: boolean }

const ROLE_LABEL: Record<string, string> = { superAdmin: "Super admin", admin: "Admin", agent: "Agent", landlord: "Landlord", customer: "Tenant / buyer" };

/** Dashboard frame: white sidebar with pill-style active item, rounded top bar, soft blue-grey canvas. */
export function DashboardShell({ title, nav, children, notificationsHref }: { title: string; nav: NavItem[]; children: React.ReactNode; notificationsHref?: string }) {
  const path = usePathname() ?? "";
  const { profile, role, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const active = (n: NavItem) => (n.exact ? path === n.href : path === n.href || path.startsWith(n.href + "/"));
  const current = [...nav].sort((a, b) => b.href.length - a.href.length).find(active);
  const list = (
    <nav className="space-y-1 px-3 py-2" aria-label={title}>
      {nav.map((n) => (
        <Link key={n.href} href={n.href} onClick={() => setOpen(false)} aria-current={active(n) ? "page" : undefined}
          className={cn("flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors", active(n) ? "bg-primary-50 text-primary" : "text-charcoal hover:bg-surface")}>
          <n.icon className={cn("h-[18px] w-[18px]", active(n) ? "text-primary" : "text-muted")} />{n.label}
        </Link>
      ))}
    </nav>
  );
  const footer = (
    <div className="space-y-1 border-t border-line p-3">
      <Link href="/" className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-charcoal hover:bg-surface"><ExternalLink className="h-[18px] w-[18px] text-muted" />View site</Link>
      <button onClick={() => signOut()} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-danger hover:bg-danger-50"><LogOut className="h-[18px] w-[18px]" />Sign out</button>
    </div>
  );
  return (
    <div className="min-h-screen bg-surface">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-line bg-white lg:flex">
        <div className="flex h-[68px] items-center px-6"><Logo /></div>
        <div className="px-6 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{title}</div>
        <div className="flex-1 overflow-y-auto">{list}</div>
        {footer}
      </aside>
      <div className="lg:pl-64">
        <div className="sticky top-0 z-30 px-4 pt-4 sm:px-6">
          <header className="flex h-16 items-center gap-3 rounded-2xl border border-line bg-white px-4 shadow-card">
            <button className="rounded-xl border border-line p-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
            <div className="min-w-0">
              <p className="truncate font-heading text-base font-bold text-charcoal">{current?.label ?? title}</p>
              <p className="hidden truncate text-xs text-muted sm:block">{title}</p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              {notificationsHref && <Link href={notificationsHref} aria-label="Notifications" className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-charcoal hover:border-primary"><Bell className="h-[18px] w-[18px]" /></Link>}
              <div className="flex items-center gap-2.5">
                <Avatar name={profile?.fullName ?? "User"} src={profile?.photo?.url} size={38} className="rounded-xl" />
                <div className="hidden text-left leading-tight sm:block"><p className="max-w-[140px] truncate text-sm font-semibold text-charcoal">{profile?.fullName ?? "Account"}</p><p className="text-xs text-muted">{role ? ROLE_LABEL[role] : ""}</p></div>
              </div>
            </div>
          </header>
        </div>
        <main className="mx-auto max-w-[1400px] p-4 sm:p-6">{children}</main>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 bg-charcoal/50 lg:hidden" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="flex h-full w-72 flex-col bg-white">
            <div className="flex h-[68px] items-center justify-between px-5"><Logo /><button onClick={() => setOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></button></div>
            <div className="flex-1 overflow-y-auto">{list}</div>
            {footer}
          </div>
        </div>
      )}
    </div>
  );
}
