"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { NotConfigured, Spinner } from "@/components/ui/States";
import { EmptyState } from "@/components/ui/States";
import { LinkButton } from "@/components/ui/Button";
import type { Role } from "@/lib/types";
import { ShieldAlert } from "lucide-react";

/** Client-side route guard. Real enforcement is in Firestore rules and Cloud Functions; this only shapes the UI. */
export function RequireAuth({ roles, children }: { roles?: Role[]; children: React.ReactNode }) {
  const { user, role, loading, configured } = useAuth();
  const router = useRouter();
  const path = usePathname();
  useEffect(() => { if (configured && !loading && !user) router.replace(`/login?next=${encodeURIComponent(path ?? "/")}`); }, [configured, loading, user, router, path]);
  if (!configured) return <div className="mx-auto max-w-xl p-6"><NotConfigured /></div>;
  if (loading || !user) return <Spinner />;
  if (roles && (!role || !roles.includes(role))) {
    return <div className="mx-auto max-w-lg p-6"><EmptyState icon={ShieldAlert} title="You do not have access to this area" message="Your account type cannot open this page." action={<LinkButton href="/">Back to home</LinkButton>} /></div>;
  }
  return <>{children}</>;
}
