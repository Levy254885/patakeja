import type { Metadata } from "next";
import { noIndex } from "@/lib/seo";
import { PortalFrame } from "@/components/portal/PortalFrame";

export const metadata: Metadata = { ...noIndex, title: "Seller portal | PataKeja" };

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <PortalFrame>{children}</PortalFrame>;
}
