"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, authErrorMessage, type RegisterInput } from "@/context/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input, Segmented } from "@/components/ui/Field";
import { NotConfigured } from "@/components/ui/States";
import { normalizeKenyanPhone } from "@/lib/format";
import { dashboardPathFor } from "@/lib/nav";

type R = RegisterInput["role"];
function Form() {
  const { register, configured } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const initial = (["customer", "landlord", "agent"].includes(sp?.get("role") ?? "") ? sp!.get("role") : "customer") as R;
  const [role, setRole] = useState<R>(initial);
  const [f, setF] = useState({ fullName: "", email: "", phone: "", password: "", companyName: "" });
  const [err, setErr] = useState<Record<string, string>>({}); const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const x: Record<string, string> = {};
    if (f.fullName.trim().length < 2) x.fullName = "Enter your full name.";
    const phone = normalizeKenyanPhone(f.phone); if (!phone) x.phone = "Enter a valid Kenyan phone number.";
    if (f.password.length < 8) x.password = "Use at least 8 characters.";
    setErr(x); if (Object.keys(x).length) return;
    setBusy(true);
    try {
      await register({ email: f.email, password: f.password, fullName: f.fullName.trim(), phone: phone!, role, companyName: role !== "customer" ? f.companyName || undefined : undefined });
      const next = sp?.get("next");
      router.replace(next && next.startsWith("/") ? next : dashboardPathFor(role));
    } catch (er) { setErr({ form: authErrorMessage(er) }); } finally { setBusy(false); }
  };
  return (
    <>
      <h1 className="font-heading text-2xl font-bold">Create your account</h1>
      <p className="mt-1 text-sm text-muted">Free to join. You pay only when you unlock a landlord's contact.</p>
      {!configured && <div className="mt-4"><NotConfigured /></div>}
      <form onSubmit={submit} className="mt-6 space-y-4">
        <Segmented<R> value={role} onChange={setRole} options={[{ value: "customer", label: "Tenant / buyer" }, { value: "landlord", label: "Landlord" }, { value: "agent", label: "Agent" }]} className="w-full [&>button]:flex-1" />
        <Input label="Full name" required value={f.fullName} onChange={(e) => set("fullName", e.target.value)} error={err.fullName} autoComplete="name" />
        <Input label="Email" type="email" required value={f.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" />
        <Input label="Phone (M-Pesa)" required value={f.phone} onChange={(e) => set("phone", e.target.value)} error={err.phone} inputMode="tel" placeholder="0712 345 678" />
        {role !== "customer" && <Input label={role === "agent" ? "Agency name (optional)" : "Company (optional)"} value={f.companyName} onChange={(e) => set("companyName", e.target.value)} />}
        <Input label="Password" type="password" required value={f.password} onChange={(e) => set("password", e.target.value)} error={err.password} hint="At least 8 characters." autoComplete="new-password" />
        {err.form && <p className="text-sm text-danger" role="alert">{err.form}</p>}
        <Button type="submit" full loading={busy} disabled={!configured}>Create account</Button>
        <p className="text-xs text-muted">By signing up you agree to our <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.</p>
      </form>
      <p className="mt-6 text-center text-sm text-muted">Already registered? <Link href="/login" className="font-medium text-forest hover:underline">Log in</Link></p>
    </>
  );
}
export default function RegisterPage() { return <Suspense><Form /></Suspense>; }
