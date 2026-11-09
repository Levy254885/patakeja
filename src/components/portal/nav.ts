import { BadgeCheck, BarChart3, Bell, Building2, CalendarClock, CreditCard, LayoutDashboard, LifeBuoy, MessageSquare, Rocket, UserCog } from "lucide-react";
import type { NavItem } from "@/components/layout/DashboardShell";

export const PORTAL_NAV: NavItem[] = [
  { href: "/portal", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/portal/properties", label: "My properties", icon: Building2 },
  { href: "/portal/enquiries", label: "Enquiries", icon: MessageSquare },
  { href: "/portal/viewings", label: "Viewing requests", icon: CalendarClock },
  { href: "/portal/boost", label: "Boost listings", icon: Rocket },
  { href: "/portal/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/portal/payments", label: "Payments", icon: CreditCard },
  { href: "/portal/verification", label: "Verification", icon: BadgeCheck },
  { href: "/portal/notifications", label: "Notifications", icon: Bell },
  { href: "/portal/profile", label: "Profile & company", icon: UserCog },
  { href: "/portal/support", label: "Support", icon: LifeBuoy },
];
