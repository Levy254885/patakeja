import {
  Banknote, Bell, Building2, ClipboardCheck, CreditCard, FileText, Flag, LayoutDashboard, LifeBuoy, Layers, MapPin, Megaphone, Rocket,
  ScrollText, Settings, Tag, TrendingUp, UserCog, Users, BadgeCheck,
} from "lucide-react";
import type { NavItem } from "@/components/layout/DashboardShell";

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/properties", label: "Properties", icon: Building2 },
  { href: "/admin/approvals", label: "Approvals", icon: ClipboardCheck },
  { href: "/admin/verification", label: "Verification", icon: BadgeCheck },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/revenue", label: "Revenue", icon: TrendingUp },
  { href: "/admin/pricing", label: "Pricing", icon: Banknote },
  { href: "/admin/boosts", label: "Boosts", icon: Rocket },
  { href: "/admin/locations", label: "Locations", icon: MapPin },
  { href: "/admin/categories", label: "Categories & amenities", icon: Layers },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/notifications", label: "Broadcast", icon: Megaphone },
  { href: "/admin/cms", label: "Help & FAQs", icon: FileText },
  { href: "/admin/tickets", label: "Support tickets", icon: LifeBuoy },
  { href: "/admin/admins", label: "Roles & admins", icon: UserCog },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/audit", label: "Audit logs", icon: ScrollText },
];
