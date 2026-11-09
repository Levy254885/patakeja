import type { Role } from "./types";
export function dashboardPathFor(role?: Role | null): string {
  if (role === "superAdmin" || role === "admin") return "/admin";
  if (role === "landlord" || role === "agent") return "/portal";
  return "/account";
}
