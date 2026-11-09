"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, authErrorMessage } from "@/context/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { NotConfigured } from "@/components/ui/States";
import { dashboardPathFor } from "@/lib/nav";
import { getAuthClient } from "@/lib/firebase/client";

function Form() {
  const { signIn, configured, refreshProfile } = useAuth();
  const router = useRouter();
  const next = useSearchParams()?.get("next");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      await signIn(email, password);
      await refreshProfile();
      const tok = await getAuthClient().currentUser?.getIdTokenResult(true);
      const claim = tok?.claims?.role as any;
      router.replace(next && next.startsWith("/") ? next : dashboardPathFor(claim ?? "customer"));
    } catch (err) { setError(authErrorMessage(err)); } finally { setBusy(false); }
  };
  return (
    <>
      <h1 className="font-heading text-2xl font-bold">Welcome back</h1>
      <p className="mt-1 text-sm text-muted">Log in to see saved homes, unlocked contacts and your listings.</p>
      {!configured && <div className="mt-4"><NotConfigured /></div>}
      <form onSubmit={submit} className="mt-6 space-y-4">
        <Input label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} error={error} />
        <div className="text-right"><Link href="/forgot-password" className="text-sm text-forest hover:underline">Forgot password?</Link></div>
        <Button type="submit" full loading={busy} disabled={!configured}>Log in</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">New to PataKeja? <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-medium text-forest hover:underline">Create an account</Link></p>
    </>
  );
}
export default function LoginPage() { return <Suspense><Form /></Suspense>; }
