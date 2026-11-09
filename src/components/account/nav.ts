import { Bell, CalendarClock, HelpCircle, Heart, History, KeyRound, LayoutDashboard, LifeBuoy, MessageSquare, Receipt, Settings, UserRound } from "lucide-react";
import type { NavItem } from "@/components/layout/DashboardShell";

export const ACCOUNT_NAV: NavItem[] = [
  { href: "/account", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/account/profile", label: "My profile", icon: UserRound },
  { href: "/account/saved", label: "Saved properties", icon: Heart },
  { href: "/account/recent", label: "Recently viewed", icon: History },
  { href: "/account/enquiries", label: "My enquiries", icon: MessageSquare },
  { href: "/account/viewings", label: "Viewing requests", icon: CalendarClock },
  { href: "/account/unlocked", label: "Unlocked contacts", icon: KeyRound },
  { href: "/account/payments", label: "Payments & receipts", icon: Receipt },
  { href: "/account/notifications", label: "Notifications", icon: Bell },
  { href: "/account/support", label: "Support", icon: LifeBuoy },
  { href: "/account/settings", label: "Settings", icon: Settings },
  { href: "/account/help", label: "Help", icon: HelpCircle },
];
