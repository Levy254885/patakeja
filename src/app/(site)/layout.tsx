import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { MobileTabBar } from "@/components/layout/MobileTabBar";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (<><SiteHeader /><main className="pb-16 md:pb-0">{children}</main><SiteFooter /><MobileTabBar /></>);
}
