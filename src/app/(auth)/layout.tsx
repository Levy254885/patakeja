import { Logo } from "@/components/layout/Logo";
import { noIndex } from "@/lib/seo";
export const metadata = noIndex;
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (<div className="flex min-h-screen flex-col items-center bg-ivory px-4 py-10"><Logo className="mb-8" /><div className="w-full max-w-md rounded border border-line bg-white p-6 sm:p-8">{children}</div></div>);
}
