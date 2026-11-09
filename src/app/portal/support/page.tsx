"use client";
import { useState } from "react";
import { LifeBuoy } from "lucide-react";
import { useAuth } from "@/context/AuthProvider";
import { useAsync } from "@/hooks/useAsync";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { Card, PageHeader } from "@/components/ui/Misc";
import { EmptyState } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { Loadable } from "@/components/portal/common";
import { createTicket, getMyTickets, replyToTicket } from "@/lib/services/support";
import { formatDateTime } from "@/lib/format";
import type { SupportTicket } from "@/lib/types";

export default function SupportPage() {
  const { user, profile } = useAuth();
  const uid = user?.uid ?? "";
  const toast = useToast();
  const s = useAsync(() => getMyTickets(uid), [uid], !!uid);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<SupportTicket["category"]>("listing");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState<Record<string, string>>({});

  const submit = async () => {
    const e: Record<string, string> = {};
    if (subject.trim().length < 3) e.subject = "Enter a subject.";
    if (message.trim().length < 10) e.message = "Describe the issue in at least 10 characters.";
    setErrors(e);
    if (Object.keys(e).length || !profile) return;
    setBusy(true);
    try { await createTicket({ userId: profile.uid, userName: profile.fullName, userEmail: profile.email, subject: subject.trim(), message: message.trim(), category }); toast.success("Ticket created."); setSubject(""); setMessage(""); s.reload(); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Could not create the ticket."); }
    finally { setBusy(false); }
  };
  const send = async (t: SupportTicket) => {
    const m = (reply[t.id] ?? "").trim();
    if (!m || !profile) return;
    try { await replyToTicket(t.id, profile.fullName, m); setReply({ ...reply, [t.id]: "" }); s.reload(); } catch (err) { toast.error(err instanceof Error ? err.message : "Could not send."); }
  };
  return (
    <>
      <PageHeader title="Support" description="Ask our team for help with your account, listings or payments." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="New ticket">
          <div className="space-y-4">
            <Select label="Topic" value={category} onChange={(e) => setCategory(e.target.value as SupportTicket["category"])}
              options={[{ value: "listing", label: "Listings" }, { value: "payment", label: "Payments" }, { value: "account", label: "Account" }, { value: "other", label: "Other" }]} />
            <Input label="Subject" required value={subject} onChange={(e) => setSubject(e.target.value)} error={errors.subject} />
            <Textarea label="Message" required value={message} onChange={(e) => setMessage(e.target.value)} error={errors.message} />
            <Button loading={busy} onClick={submit}>Send</Button>
          </div>
        </Card>
        <div>
          <h2 className="mb-3 font-heading text-base font-semibold text-charcoal">Your tickets</h2>
          <Loadable state={s}>
            {(rows) => !rows.length ? <EmptyState icon={LifeBuoy} title="No tickets" message="Your conversations with support appear here." /> : (
              <ul className="space-y-3">{rows.map((t) => (
                <li key={t.id} className="rounded border border-line bg-white p-4 text-sm">
                  <div className="flex justify-between gap-2"><p className="font-heading font-semibold text-charcoal">{t.subject}</p><StatusBadge status={t.status} /></div>
                  <p className="mt-1 whitespace-pre-line text-muted">{t.message}</p>
                  {t.replies?.map((r, i) => <p key={i} className="mt-2 border-l-2 border-line pl-3"><span className="text-xs text-muted">{r.by === "staff" ? "Support" : "You"}, {formatDateTime(r.at)}</span><br />{r.message}</p>)}
                  {t.status !== "closed" && <div className="mt-3 flex gap-2"><Input aria-label="Reply" className="flex-1" value={reply[t.id] ?? ""} onChange={(e) => setReply({ ...reply, [t.id]: e.target.value })} placeholder="Write a reply" /><Button variant="secondary" onClick={() => send(t)}>Reply</Button></div>}
                </li>))}</ul>
            )}
          </Loadable>
        </div>
      </div>
    </>
  );
}
