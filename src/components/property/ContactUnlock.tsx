"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CheckCircle2, Lock, Mail, MessageCircle, Phone, Receipt } from "lucide-react";
import type { Payment, PricingSettings, PropertyContact } from "@/lib/types";
import { useAuth } from "@/context/AuthProvider";
import { getPricing } from "@/lib/services/catalog";
import { getPrivateContact, hasUnlocked, startPayment, waitForPayment } from "@/lib/services/payments";
import { effectivePrice } from "@/lib/pricing";
import { formatKES, normalizeKenyanPhone, whatsappLink } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { NotConfigured } from "@/components/ui/States";

type Phase = "idle" | "sending" | "waiting" | "failed";

/**
 * Landlord contact is stored in properties/{id}/private/contact and is only readable after
 * the Cloud Function writes contactUnlocks/{uid_propertyId}. The browser never decides the price or the unlock.
 */
export function ContactUnlock({ propertyId, ownerId }: { propertyId: string; ownerId: string }) {
  const { user, profile, configured } = useAuth();
  const router = useRouter();
  const path = usePathname();
  const [pricing, setPricing] = useState<PricingSettings | null>(null);
  const [contact, setContact] = useState<PropertyContact | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");

  useEffect(() => { if (configured) getPricing().then(setPricing).catch(() => undefined); }, [configured]);
  useEffect(() => { if (profile?.phone && !phone) setPhone(profile.phone); }, [profile, phone]);
  useEffect(() => {
    if (!user || !configured) return;
    const isOwner = user.uid === ownerId;
    (isOwner ? Promise.resolve(true) : hasUnlocked(user.uid, propertyId)).then(async (ok) => { if (ok) setContact(await getPrivateContact(propertyId)); }).catch(() => undefined);
  }, [user, configured, propertyId, ownerId]);

  if (!configured) return <NotConfigured />;
  const fee = pricing ? effectivePrice(pricing.contactAccess) : null;
  const enabled = pricing ? pricing.contactAccess.enabled !== false : true;

  if (contact) {
    const wa = whatsappLink(contact.whatsapp || contact.phone, "Hello, I found your property on PataKeja.");
    return (
      <div className="space-y-3 rounded border border-line bg-white p-5">
        <p className="flex items-center gap-2 text-sm font-medium text-success"><CheckCircle2 className="h-4 w-4" />Contact unlocked</p>
        <p className="font-heading text-base font-semibold">{contact.contactName}</p>
        <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-sm hover:text-forest"><Phone className="h-4 w-4 text-muted" />{contact.phone}</a>
        {contact.email && <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-sm hover:text-forest"><Mail className="h-4 w-4 text-muted" />{contact.email}</a>}
        {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded bg-forest text-sm font-medium text-white"><MessageCircle className="h-4 w-4" />Chat on WhatsApp</a>}
        {payment && <p className="flex items-center gap-1.5 border-t border-line pt-3 text-xs text-muted"><Receipt className="h-3.5 w-3.5" />M-Pesa receipt {payment.mpesaReceipt ?? "pending"} · {formatKES(payment.amount)}</p>}
      </div>
    );
  }

  const begin = () => {
    if (!user) return router.push(`/login?next=${encodeURIComponent(path ?? "/")}`);
    setError(""); setPhase("idle"); setOpen(true);
  };
  const pay = async () => {
    const msisdn = normalizeKenyanPhone(phone);
    if (!msisdn) return setError("Enter a valid Safaricom number, e.g. 0712 345 678.");
    setError(""); setPhase("sending");
    try {
      const res = await startPayment({ purpose: "contact-access", propertyId, phone: msisdn });
      if (res.amount === 0) { setContact(await getPrivateContact(propertyId)); setOpen(false); return; }
      setPhase("waiting");
      const p = await waitForPayment(res.paymentId);
      setPayment(p);
      if (p.status === "success") { setContact(await getPrivateContact(propertyId)); setOpen(false); }
      else { setPhase("failed"); setError(p.status === "cancelled" ? "The payment was cancelled on your phone." : "The payment did not go through. You have not been charged unless M-Pesa says otherwise."); }
    } catch (e) {
      setPhase("failed"); setError(e instanceof Error ? e.message : "Could not start the payment. Try again.");
    }
  };

  return (
    <div className="rounded border border-line bg-white p-5">
      <div className="flex items-center gap-2 text-sm text-muted"><Lock className="h-4 w-4" />Landlord contact is hidden</div>
      <p className="mt-2 text-sm text-charcoal">Unlock the direct phone number and WhatsApp for this property{fee !== null && enabled ? <> for <strong>{formatKES(fee)}</strong> via M-Pesa — one payment, yours to keep.</> : "."}</p>
      <Button full className="mt-4" onClick={begin} disabled={!enabled && !!pricing}>{user ? "Unlock contact" : "Log in to unlock contact"}</Button>
      {!enabled && pricing && <p className="mt-2 text-xs text-muted">Contact unlocking is temporarily unavailable.</p>}
      <Modal open={open} onClose={() => phase !== "waiting" && setOpen(false)} title="Pay with M-Pesa" size="sm"
        footer={<><Button variant="ghost" onClick={() => setOpen(false)} disabled={phase === "waiting" || phase === "sending"}>Close</Button><Button onClick={pay} loading={phase === "sending" || phase === "waiting"}>{phase === "failed" ? "Try again" : `Pay ${fee !== null ? formatKES(fee) : ""}`}</Button></>}>
        <div className="space-y-3">
          <Input label="M-Pesa phone number" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712 345 678" inputMode="tel" error={error} disabled={phase === "waiting"} />
          {phase === "waiting" ? <p className="text-sm text-charcoal">Check your phone and enter your M-Pesa PIN. We are waiting for confirmation…</p> : <p className="text-xs text-muted">You will get an M-Pesa prompt on this number. The amount is set by PataKeja and confirmed by our server.</p>}
        </div>
      </Modal>
    </div>
  );
}
