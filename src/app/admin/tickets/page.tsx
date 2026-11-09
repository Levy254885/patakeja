"use client";
import { useState } from "react";
import { LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge, type Tone } from "@/components/ui/Badge";
import { Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/States";
import { DataTable, PageHeader, Tabs } from "@/components/ui/Misc";
import { AsyncView, useAction } from "@/components/admin/common";
import { useAuth } from "@/context/AuthProvider";
import { useAsync } from "@/hooks/useAsync";
import { listTickets, setTicketStatus } from "@/lib/services/admin";
import { replyToTicket } from "@/lib/services/support";
import { formatDateTime } from "@/lib/format";
import type { SupportTicket } from "@/lib/types";

type Filter = "all" | SupportTicket["status"];
const TONE: Record<SupportTicket["status"], Tone> = { open: "red", pending: "amber", closed: "neutral" };

export default function AdminTicketsPage() {
  const { profile } = useAuth();
  const state = useAsync(() => listTickets(), []);
  const run = useAction();
  const [filter, setFilter] = useState<Filter>("open");
  const [sel, setSel] = useState<SupportTicket | null>(null);
  const [reply, setReply] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const close = () => { setSel(null); setReply(""); setErr(""); };
  const send = async () => {
    if (!sel) return;
    if (reply.trim().length < 2) { setErr("Write a reply first"); return; }
    setBusy(true);
    const ok = await run(() => replyToTicket(sel.id, profile?.fullName || "PataKeja Support", reply.trim(), "staff"), "Reply sent");
    setBusy(false);
    if (ok) { close(); state.reload(); }
  };
  const changeStatus = async (s: SupportTicket["status"]) => {
    if (!sel) return;
    if (await run(() => setTicketStatus(sel.id, s), "Status updated")) { setSel({ ...sel, status: s }); state.reload(); }
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Support tickets" description="Help requests from users." />
      <AsyncView state={state}>
        {(all) => {
          const rows = filter === "all" ? all : all.filter((t) => t.status === filter);
          const count = (s: Filter) => (s === "all" ? all.length : all.filter((t) => t.status === s).length);
          return (
            <>
              <Tabs value={filter} onChange={setFilter} tabs={(["open", "pending", "closed", "all"] as Filter[]).map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1), count: count(v) }))} />
              <DataTable rows={rows} rowKey={(r) => r.id}
                empty={<EmptyState icon={LifeBuoy} title="No tickets" message="No support tickets in this view." />}
                columns={[
                  { key: "s", header: "Subject", render: (r) => <button className="text-left font-medium text-forest hover:underline" onClick={() => setSel(r)}>{r.subject}</button> },
                  { key: "u", header: "From", render: (r) => <div><div>{r.userName}</div><div className="text-xs text-muted">{r.userEmail}</div></div> },
                  { key: "c", header: "Category", render: (r) => <span className="capitalize">{r.category}</span> },
                  { key: "st", header: "Status", render: (r) => <Badge tone={TONE[r.status]}>{r.status}</Badge> },
                  { key: "d", header: "Updated", render: (r) => formatDateTime(r.updatedAt ?? r.createdAt) },
                ]} />
            </>
          );
        }}
      </AsyncView>
      <Modal open={!!sel} onClose={close} title={sel?.subject ?? "Ticket"}
        footer={<><Button variant="secondary" onClick={close}>Close</Button><Button loading={busy} onClick={send}>Send reply</Button></>}>
        {sel && (
          <div className="space-y-4">
            <p className="text-sm text-muted">{sel.userName} ({sel.userEmail}) · {formatDateTime(sel.createdAt)}</p>
            <div className="space-y-3">
              <div className="rounded border border-line bg-ivory p-3 text-sm whitespace-pre-wrap">{sel.message}</div>
              {(sel.replies ?? []).map((r, i) => (
                <div key={i} className={`rounded border p-3 text-sm whitespace-pre-wrap ${r.by === "staff" ? "border-forest/30 bg-forest/5" : "border-line bg-ivory"}`}>
                  <div className="mb-1 text-xs text-muted">{r.by === "staff" ? "Staff" : "User"} · {r.name} · {formatDateTime(r.at)}</div>{r.message}
                </div>
              ))}
            </div>
            <Select label="Status" value={sel.status} onChange={(e) => changeStatus(e.target.value as SupportTicket["status"])}
              options={[{ value: "open", label: "Open" }, { value: "pending", label: "Pending (awaiting user)" }, { value: "closed", label: "Closed" }]} />
            <Textarea label="Reply" rows={4} value={reply} error={err} onChange={(e) => setReply(e.target.value)} />
          </div>
        )}
      </Modal>
    </div>
  );
}
