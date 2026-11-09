"use client";
import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/States";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/Badge";
import { DataTable, PageHeader, Tabs } from "@/components/ui/Misc";
import { AsyncView, useAction } from "@/components/admin/common";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/context/AuthProvider";
import { listVerificationRequests, reviewVerification } from "@/lib/services/admin";
import { formatDate } from "@/lib/format";
import type { VerificationRequest } from "@/lib/types";

type Tab = "pending" | "approved" | "rejected";

export default function AdminVerificationPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("pending");
  const state = useAsync(() => listVerificationRequests(tab), [tab]);
  const run = useAction();
  const [sel, setSel] = useState<{ req: VerificationRequest; approve: boolean } | null>(null);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!sel || !user) return;
    if (!sel.approve && note.trim().length < 5) { setErr("A reason is required when rejecting."); return; }
    setBusy(true);
    const ok = await run(() => reviewVerification(sel.req, sel.approve, user.uid, note), sel.approve ? "Approved" : "Rejected");
    setBusy(false);
    if (ok) { setSel(null); state.reload(); }
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Verification" description="Landlord, agent and property verification requests with supporting documents." />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: "pending", label: "Pending" }, { value: "approved", label: "Approved" }, { value: "rejected", label: "Rejected" }]} />
      <AsyncView state={state}>
        {(rows) => (
          <DataTable rows={rows} rowKey={(r) => r.id} empty={<EmptyState title={`No ${tab} requests`} />}
            columns={[
              { key: "u", header: "Requester", render: (r) => <div><div className="font-medium">{r.userName}</div><div className="text-xs capitalize text-muted">{r.kind}{r.propertyId ? ` · ${r.propertyId}` : ""}</div></div> },
              { key: "n", header: "Note", render: (r) => <span className="text-muted">{r.note || r.reviewNote || "-"}</span> },
              { key: "docs", header: "Documents", render: (r) => r.documents?.length ? <div className="flex flex-wrap gap-2">{r.documents.map((d, i) => <a key={d.publicId} href={d.url} target="_blank" rel="noopener noreferrer" className="text-forest underline">Doc {i + 1}</a>)}</div> : <span className="text-muted">None</span> },
              { key: "s", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
              { key: "d", header: "Date", render: (r) => formatDate(r.createdAt) },
              { key: "a", header: "", className: "text-right", render: (r) => r.status !== "pending" ? null : (
                <div className="flex justify-end gap-2">
                  <Button size="sm" onClick={() => { setSel({ req: r, approve: true }); setNote(""); setErr(""); }}><Check className="h-4 w-4" />Approve</Button>
                  <Button size="sm" variant="secondary" onClick={() => { setSel({ req: r, approve: false }); setNote(""); setErr(""); }}><X className="h-4 w-4" />Reject</Button>
                </div>
              ) },
            ]} />
        )}
      </AsyncView>
      <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.approve ? "Approve verification" : "Reject verification"}
        footer={<><Button variant="secondary" onClick={() => setSel(null)}>Cancel</Button><Button variant={sel?.approve ? "primary" : "danger"} loading={busy} onClick={submit}>{sel?.approve ? "Approve" : "Reject"}</Button></>}>
        <p className="mb-3 text-sm text-muted">{sel?.req.userName} ({sel?.req.kind})</p>
        <Textarea label={sel?.approve ? "Note (optional)" : "Reason"} rows={3} value={note} error={err} onChange={(e) => setNote(e.target.value)} />
      </Modal>
    </div>
  );
}
