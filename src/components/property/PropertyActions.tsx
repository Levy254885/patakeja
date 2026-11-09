"use client";
import { useState } from "react";
import { Flag, Share2 } from "lucide-react";
import type { Property } from "@/lib/types";
import { useAuth } from "@/context/AuthProvider";
import { createInquiry, createViewing } from "@/lib/services/enquiries";
import { createReport } from "@/lib/services/support";
import { normalizeKenyanPhone } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { SaveButton } from "./SaveButton";

type Kind = "enquiry" | "viewing" | "report" | null;
const REASONS = [{ value: "wrong-info", label: "Wrong price or details" }, { value: "unavailable", label: "Already rented / sold" }, { value: "scam", label: "Looks like a scam" }, { value: "duplicate", label: "Duplicate listing" }, { value: "other", label: "Other" }];

export function PropertyActions({ p }: { p: Pick<Property, "id" | "title" | "ownerId"> }) {
  const { user, profile } = useAuth();
  const toast = useToast();
  const [kind, setKind] = useState<Kind>(null);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState<Record<string, string>>({});
  const [err, setErr] = useState<Record<string, string>>({});
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));
  const open = (k: Kind) => { setErr({}); setF({ name: profile?.fullName ?? "", phone: profile?.phone ?? "", email: user?.email ?? "" }); setKind(k); };

  const share = async () => {
    const url = window.location.href;
    try { if (navigator.share) await navigator.share({ title: p.title, url }); else { await navigator.clipboard.writeText(url); toast.success("Link copied"); } } catch { /* cancelled */ }
  };
  const submit = async () => {
    const e: Record<string, string> = {};
    if (kind !== "report") {
      if (!f.name?.trim()) e.name = "Enter your name.";
      if (!normalizeKenyanPhone(f.phone ?? "")) e.phone = "Enter a valid Kenyan phone number.";
    }
    if (kind === "enquiry" && !(f.message ?? "").trim()) e.message = "Write a short message.";
    if (kind === "viewing") { if (!f.date) e.date = "Pick a date."; if (!f.time) e.time = "Pick a time."; }
    if (kind === "report" && !f.reason) e.reason = "Choose a reason.";
    if (kind === "report" && !user) e.reason = "Sign in to report a listing.";
    setErr(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const base = { propertyId: p.id, propertyTitle: p.title, ownerId: p.ownerId, name: f.name, phone: normalizeKenyanPhone(f.phone)!, email: f.email || undefined, customerId: user?.uid };
      if (kind === "enquiry") { await createInquiry({ ...base, message: f.message }); toast.success("Enquiry sent to the landlord."); }
      if (kind === "viewing") { await createViewing({ ...base, preferredDate: f.date, preferredTime: f.time, message: f.message || undefined }); toast.success("Viewing request sent."); }
      if (kind === "report") { await createReport({ propertyId: p.id, propertyTitle: p.title, reason: f.reason as "other" | "scam" | "wrong-info" | "unavailable" | "duplicate", details: f.message, reporterId: user!.uid }); toast.success("Thanks. Our team will review this listing."); }
      setKind(null);
    } catch { toast.error("Could not send. Please try again."); } finally { setBusy(false); }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => open("enquiry")}>Send enquiry</Button>
        <Button variant="outline" size="sm" onClick={() => open("viewing")}>Request viewing</Button>
        <SaveButton propertyId={p.id} label className="border border-line" />
        <Button variant="ghost" size="sm" onClick={share}><Share2 className="h-4 w-4" />Share</Button>
        <Button variant="ghost" size="sm" onClick={() => open("report")}><Flag className="h-4 w-4" />Report</Button>
      </div>
      <Modal open={!!kind} onClose={() => setKind(null)} title={kind === "enquiry" ? "Send an enquiry" : kind === "viewing" ? "Request a viewing" : "Report this listing"}
        footer={<><Button variant="ghost" onClick={() => setKind(null)}>Cancel</Button><Button loading={busy} onClick={submit}>Send</Button></>}>
        <div className="space-y-3">
          {kind !== "report" && <>
            <Input label="Your name" value={f.name ?? ""} onChange={(e) => set("name", e.target.value)} error={err.name} />
            <Input label="Phone" value={f.phone ?? ""} onChange={(e) => set("phone", e.target.value)} error={err.phone} inputMode="tel" />
            <Input label="Email (optional)" type="email" value={f.email ?? ""} onChange={(e) => set("email", e.target.value)} />
          </>}
          {kind === "viewing" && <div className="grid grid-cols-2 gap-3"><Input label="Preferred date" type="date" value={f.date ?? ""} onChange={(e) => set("date", e.target.value)} error={err.date} /><Input label="Time" type="time" value={f.time ?? ""} onChange={(e) => set("time", e.target.value)} error={err.time} /></div>}
          {kind === "report" && <Select label="Reason" options={REASONS} placeholder="Choose a reason" value={f.reason ?? ""} onChange={(e) => set("reason", e.target.value)} error={err.reason} />}
          <Textarea label={kind === "report" ? "Details (optional)" : "Message"} value={f.message ?? ""} onChange={(e) => set("message", e.target.value)} error={err.message} />
        </div>
      </Modal>
    </>
  );
}
