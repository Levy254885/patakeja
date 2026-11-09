"use client";
import { useState } from "react";
import { LifeBuoy } from "lucide-react";
import { useAuth } from "@/context/AuthProvider";
import { useAsync } from "@/hooks/useAsync";
import { PageHeader, Card } from "@/components/ui/Misc";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { Loadable } from "@/components/account/parts";
import { createTicket, getMyTickets, replyToTicket } from "@/lib/services/support";
import { formatDateTime } from "@/lib/format";
import type { SupportTicket } from "@/lib/types";

const CATS = [{ value: "account", label: "Account" }, { value: "payment", label: "Payment" }, { value: "listing", label: "A listing" }, { value: "other", label: "Other" }];

function Reply({ t, onDone }: { t: SupportTicket; onDone: () => void }) {
  const { profile } = useAuth();
  const toast = useToast();
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const send = async () => {
    if (!msg.trim()) return;
    setBusy(true);
    try { await replyToTicket(t.id, profile?.fullName ?? "You", msg.trim()); setMsg(""); onDone(); } catch (e) { toast.error(e instanceof Error ? e.message : "Could not send reply."); } finally { setBusy(false); }
  };
  return (
    <div className="mt-3 flex gap-2">
      <Input aria-label="Reply" placeholder="Write a reply" value={msg} onChange={(e) => setMsg(e.target.value)} className="flex-1" />
      <Button size="md" variant="outline" onClick={send} loading={busy} disabled={!msg.trim()}>Reply</Button>
    </div>
  );
}

export default function SupportPage() {
  const { user, profile } = useAuth();
  const toast = useToast();
  const uid = user?.uid ?? "";
  const s = useAsync(() => getMyTickets(uid), [uid], !!uid);
  const [category, setCategory] = useState<SupportTicket["category"]>("account");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (subject.trim().length < 4) err.subject = "Add a short subject.";
    if (message.trim().length < 10) err.message = "Describe the problem in a few words (at least 10 characters).";
    setErrors(err);
    if (Object.keys(err).length || !user) return;
    setBusy(true);
    try {
      await createTicket({ userId: user.uid, userName: profile?.fullName ?? "", userEmail: profile?.email ?? user.email ?? "", subject: subject.trim(), message: message.trim(), category });
      setSubject(""); setMessage(""); toast.success("Ticket sent. We will reply here.");
      s.reload();
    } catch (x) { toast.error(x instanceof Error ? x.message : "Could not send your ticket."); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="Support" description="Open a ticket and follow the replies here." />
      <div className="grid gap-6 lg:grid-cols-5">
        <form onSubmit={submit} noValidate className="lg:col-span-2">
          <Card title="New ticket">
            <div className="space-y-4">
              <Select label="Topic" options={CATS} value={category} onChange={(e) => setCategory(e.target.value as SupportTicket["category"])} />
              <Input label="Subject" required value={subject} onChange={(e) => setSubject(e.target.value)} error={errors.subject} />
              <Textarea label="Message" required value={message} onChange={(e) => setMessage(e.target.value)} error={errors.message} hint="For payment problems, include the payment reference." />
              <Button type="submit" loading={busy}>Send ticket</Button>
            </div>
          </Card>
        </form>
        <div className="lg:col-span-3">
          <Loadable state={s} rows={2}>
            {(rows) => rows.length ? (
              <ul className="space-y-3">
                {rows.map((t) => (
                  <li key={t.id} className="rounded border border-line bg-white p-4">
                    <div className="flex items-start justify-between gap-2"><p className="font-heading text-sm font-semibold text-charcoal">{t.subject}</p><StatusBadge status={t.status} /></div>
                    <p className="text-xs text-muted">{formatDateTime(t.createdAt)}</p>
                    <p className="mt-2 whitespace-pre-line text-sm text-charcoal">{t.message}</p>
                    {t.replies?.map((r, i) => (
                      <div key={i} className={`mt-2 rounded p-2.5 text-sm ${r.by === "staff" ? "bg-ivory" : "border border-line"}`}>
                        <p className="text-xs text-muted">{r.by === "staff" ? "PataKeja support" : "You"} - {formatDateTime(r.at)}</p>
                        <p className="whitespace-pre-line text-charcoal">{r.message}</p>
                      </div>
                    ))}
                    {t.status !== "closed" && <Reply t={t} onDone={s.reload} />}
                  </li>
                ))}
              </ul>
            ) : <EmptyState icon={LifeBuoy} title="No tickets yet" message="Your support tickets will appear here." />}
          </Loadable>
        </div>
      </div>
    </>
  );
}
