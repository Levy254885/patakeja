"use client";
import { useEffect, useRef, useState } from "react";
import { Smartphone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthProvider";
import { normalizeKenyanPhone, formatKES } from "@/lib/format";
import { startPayment, waitForPayment } from "@/lib/services/payments";
import type { PaymentPurpose } from "@/lib/types";

/**
 * M-Pesa STK push form. The amount shown is informational; the server decides what is charged.
 * Calls onPaid once the payment is confirmed successful (or the charge is disabled and the server returns amount 0).
 */
export function PaymentPanel({ purpose, propertyId, amount, label, onPaid }: { purpose: PaymentPurpose; propertyId?: string; amount: number; label: string; onPaid?: () => void }) {
  const { profile } = useAuth();
  const toast = useToast();
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);
  useEffect(() => { if (!phone && profile?.phone) setPhone(profile.phone); }, [profile?.phone]); // eslint-disable-line react-hooks/exhaustive-deps

  const pay = async () => {
    const n = normalizeKenyanPhone(phone);
    if (!n) return setError("Enter a valid Safaricom number, e.g. 0712 345 678.");
    setError("");
    setBusy(true);
    try {
      const res = await startPayment({ purpose, propertyId, phone: n });
      if (res.amount === 0) {
        toast.success(res.message || "No charge was needed.");
        onPaid?.();
        return;
      }
      toast.info(res.message || "Check your phone and enter your M-Pesa PIN.");
      setWaiting(true);
      abort.current = new AbortController();
      const p = await waitForPayment(res.paymentId, { signal: abort.current.signal });
      if (p.status === "success") {
        toast.success(`Payment received${p.mpesaReceipt ? `. Receipt ${p.mpesaReceipt}` : ""}.`);
        onPaid?.();
      } else {
        toast.error(p.resultDesc || "The payment was not completed.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start the payment.");
    } finally {
      setBusy(false);
      setWaiting(false);
    }
  };

  return (
    <div className="space-y-3">
      <Input label="M-Pesa phone number" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} error={error} hint="You will receive a prompt on this number." disabled={busy} />
      <Button onClick={pay} loading={busy}><Smartphone className="h-4 w-4" />{waiting ? "Waiting for confirmation..." : `${label} (${formatKES(amount)})`}</Button>
    </div>
  );
}
