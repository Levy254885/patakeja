"use client";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { RequireAuth } from "@/components/layout/RequireAuth";
import { ACCOUNT_NAV } from "./nav";

export function AccountShell({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth roles={["customer", "landlord", "agent", "admin", "superAdmin"]}>
      <DashboardShell title="My account" nav={ACCOUNT_NAV}>{children}</DashboardShell>
    </RequireAuth>
  );
}
