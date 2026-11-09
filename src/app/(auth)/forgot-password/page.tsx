"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth, authErrorMessage } from "@/context/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

export default function ForgotPasswordPage() {
  const { resetPassword, configured } = useAuth();
  const [email, setEmail] = useState(""); const [sent, setSent] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const submit = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true); setError(""); try { await resetPassword(email); setSent(true); } catch (er) { setError(authErrorMessage(er)); } finally { setBusy(false); } };
  return (
    <>
      <h1 className="font-heading text-2xl font-bold">Reset your password</h1>
      {sent ? <p className="mt-4 text-sm text-charcoal">If an account exists for <strong>{email}</strong>, a reset link is on its way. Check your inbox and spam folder.</p> : (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} error={error} />
          <Button type="submit" full loading={busy} disabled={!configured}>Send reset link</Button>
        </form>)}
      <p className="mt-6 text-center text-sm"><Link href="/login" className="text-forest hover:underline">Back to log in</Link></p>
    </>
  );
}
