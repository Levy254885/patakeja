"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LogOut } from "lucide-react";
import { useAuth, authErrorMessage } from "@/context/AuthProvider";
import { PageHeader, Card } from "@/components/ui/Misc";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export default function SettingsPage() {
  const { user, profile, resetPassword, signOut } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const email = profile?.email ?? user?.email ?? "";

  const reset = async () => {
    setBusy(true);
    try { await resetPassword(email); toast.success(`Password reset link sent to ${email}.`); } catch (e) { toast.error(authErrorMessage(e)); } finally { setBusy(false); }
  };
  const out = async () => {
    try { await signOut(); router.replace("/"); } catch (e) { toast.error(authErrorMessage(e)); }
  };

  return (
    <>
      <PageHeader title="Settings" description="Security and session." />
      <div className="max-w-2xl space-y-5">
        <Card title="Password">
          <p className="text-sm text-muted">We will email a password reset link to <span className="font-medium text-charcoal">{email || "your email"}</span>.</p>
          <Button className="mt-3" variant="outline" onClick={reset} loading={busy} disabled={!email}><KeyRound className="h-4 w-4" />Send reset link</Button>
        </Card>
        <Card title="Sign out">
          <p className="text-sm text-muted">Sign out of PataKeja on this device.</p>
          <Button className="mt-3" variant="outline" onClick={out}><LogOut className="h-4 w-4" />Sign out</Button>
        </Card>
        <p className="text-xs text-muted">To delete your account or export your data, open a request from Support.</p>
      </div>
    </>
  );
}
