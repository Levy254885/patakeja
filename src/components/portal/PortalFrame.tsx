"use client";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { RequireAuth } from "@/components/layout/RequireAuth";
import { PORTAL_NAV } from "./nav";
import { LISTER_ROLES } from "@/lib/types";

export function PortalFrame({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth roles={LISTER_ROLES}>
      <DashboardShell title="Seller portal" nav={PORTAL_NAV}>{children}</DashboardShell>
    </RequireAuth>
  );
}
