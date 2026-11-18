"use client";
import { useState } from "react";
import { CalendarClock, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthProvider";
import { createInquiry, createViewing } from "@/lib/services/enquiries";
import { normalizeKenyanPhone } from "@/lib/format";
import type { Property } from "@/lib/types";

type Target = Pick<Property, "id" | "title" | "ownerId">;
type Errors = Record<string, string>;

function useBase() {
  const { user, profile } = useAuth();
  const [name, setName] = useState(profile?.fullName ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  return { user, name, setName, phone, setPhone, email, setEmail };
}
function validateBase(b: { name: string; phone: string; email: string }): Errors {
  const e: Errors = {};
  if (b.name.trim().length < 2) e.name = "Enter your name.";
  if (!normalizeKenyanPhone(b.phone)) e.phone = "Enter a valid Kenyan phone number.";
  if (b.email && !/^\S+@\S+\.\S+$/.test(b.email)) e.email = "Enter a valid email address.";
  return e;
}
function Contacts({ b, errors }: { b: ReturnType<typeof useBase>; errors: Errors }) {
  return (
    <>
      <Input label="Your name" required value={b.name} onChange={(e) => b.setName(e.target.value)} error={errors.name} autoComplete="name" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Phone" required type="tel" value={b.phone} onChange={(e) => b.setPhone(e.target.value)} error={errors.phone} autoComplete="tel" />
        <Input label="Email (optional)" type="email" value={b.email} onChange={(e) => b.setEmail(e.target.value)} error={errors.email} autoComplete="email" />
      </div>
    </>
  );
}

function FormModal({ open, onClose, title, onSubmit, busy, children, cta }: { open: boolean; onClose: () => void; title: string; onSubmit: () => void; busy: boolean; children: React.ReactNode; cta: string }) {
  return (
    <Modal open={open} onClose={onClose} title={title} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={onSubmit} loading={busy}>{cta}</Button></>}>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onSubmit(); }} noValidate>{children}</form>
    </Modal>
  );
}

export function PropertyEnquiryButtons({ property }: { property: Target }) {
  const [mode, setMode] = useState<"" | "enquiry" | "viewing">("");
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={() => setMode("enquiry")}><MessageSquare className="h-4 w-4" />Send enquiry</Button>
        <Button variant="outline" onClick={() => setMode("viewing")}><CalendarClock className="h-4 w-4" />Book viewing</Button>
      </div>
      <InquiryForm property={property} open={mode === "enquiry"} onClose={() => setMode("")} />
      <ViewingForm property={property} open={mode === "viewing"} onClose={() => setMode("")} />
    </>
  );
}

function InquiryForm({ property, open, onClose }: { property: Target; open: boolean; onClose: () => void }) {
  const b = useBase();
  const toast = useToast();
  const [message, setMessage] = useState(`Hello, I am interested in "${property.title}". Is it still available?`);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    const e = validateBase(b);
    if (message.trim().length < 10) e.message = "Write a short message (at least 10 characters).";
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await createInquiry({ propertyId: property.id, propertyTitle: property.title, ownerId: property.ownerId, name: b.name.trim(), phone: normalizeKenyanPhone(b.phone)!, email: b.email.trim() || undefined, message: message.trim(), customerId: b.user?.uid });
      toast.success("Enquiry sent. The landlord will get back to you.");
      onClose();
    } catch { toast.error("Could not send your enquiry. Please try again."); }
    finally { setBusy(false); }
  };
  return (
    <FormModal open={open} onClose={onClose} title="Send an enquiry" onSubmit={submit} busy={busy} cta="Send enquiry">
      <Contacts b={b} errors={errors} />
      <Textarea label="Message" required value={message} onChange={(e) => setMessage(e.target.value)} error={errors.message} />
    </FormModal>
  );
}

function ViewingForm({ property, open, onClose }: { property: Target; open: boolean; onClose: () => void }) {
  const b = useBase();
  const toast = useToast();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const submit = async () => {
    const e = validateBase(b);
    if (!date || date < today) e.date = "Choose today or a future date.";
    if (!time) e.time = "Choose a time.";
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await createViewing({ propertyId: property.id, propertyTitle: property.title, ownerId: property.ownerId, name: b.name.trim(), phone: normalizeKenyanPhone(b.phone)!, email: b.email.trim() || undefined, preferredDate: date, preferredTime: time, message: message.trim() || undefined, customerId: b.user?.uid });
      toast.success("Viewing requested. The landlord will confirm the time.");
      onClose();
    } catch { toast.error("Could not request the viewing. Please try again."); }
    finally { setBusy(false); }
  };
  return (
    <FormModal open={open} onClose={onClose} title="Book a viewing" onSubmit={submit} busy={busy} cta="Request viewing">
      <Contacts b={b} errors={errors} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Preferred date" required type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} error={errors.date} />
        <Input label="Preferred time" required type="time" value={time} onChange={(e) => setTime(e.target.value)} error={errors.time} />
      </div>
      <Textarea label="Note (optional)" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
    </FormModal>
  );
}
