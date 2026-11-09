import type { Metadata } from "next";
import { noIndex } from "@/lib/seo";
import { AdminFrame } from "@/components/admin/AdminFrame";

export const metadata: Metadata = { ...noIndex, title: "Admin | PataKeja" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminFrame>{children}</AdminFrame>;
}
