import { noIndex } from "@/lib/seo";
import { AccountShell } from "@/components/account/AccountShell";

export const metadata = { ...noIndex, title: "My account" };

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <AccountShell>{children}</AccountShell>;
}
