"use client";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { RequireAuth } from "@/components/layout/RequireAuth";
import { ADMIN_NAV } from "./nav";
import { ADMIN_ROLES } from "@/lib/types";

export function AdminFrame({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth roles={ADMIN_ROLES}>
      <DashboardShell title="Admin" nav={ADMIN_NAV}>{children}</DashboardShell>
    </RequireAuth>
  );
}
