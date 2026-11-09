"use client";
import Link from "next/link";
import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/States";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable, PageHeader } from "@/components/ui/Misc";
import { AsyncView, useAction } from "@/components/admin/common";
import { useAsync } from "@/hooks/useAsync";
import { approveProperty, listPropertiesByStatus, rejectProperty } from "@/lib/services/admin";
import { formatDate, formatKES, propertySlug } from "@/lib/format";
import type { Property } from "@/lib/types";

export default function AdminApprovalsPage() {
  const state = useAsync(() => listPropertiesByStatus("pending"), []);
  const run = useAction();
  const [approve, setApprove] = useState<Property | null>(null);
  const [reject, setReject] = useState<Property | null>(null);
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const doReject = async () => {
    if (reason.trim().length < 5) { setErr("Give the owner a clear reason (at least 5 characters)."); return; }
    if (!reject) return;
    setBusy(true);
    const ok = await run(() => rejectProperty(reject.id, reason), "Listing rejected");
    setBusy(false);
    if (ok) { setReject(null); setReason(""); state.reload(); }
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Approvals" description="Listings waiting for review. Rejections must include a reason the owner can see." />
      <AsyncView state={state}>
        {(rows) => (
          <DataTable rows={rows} rowKey={(p) => p.id} empty={<EmptyState title="Nothing to review" message="New submissions will appear here." />}
            columns={[
              { key: "t", header: "Listing", render: (p) => (
                <div>
                  <Link className="font-medium hover:text-forest" target="_blank" href={`/property/${p.slug || propertySlug(p.title, p.id)}`}>{p.title}</Link>
                  <div className="text-xs text-muted">{p.categoryName} · {p.location?.town}, {p.location?.county} · {p.images?.length ?? 0} photos</div>
                </div>
              ) },
              { key: "o", header: "Owner", render: (p) => p.owner?.name },
              { key: "p", header: "Price", render: (p) => formatKES(p.price) },
              { key: "d", header: "Submitted", render: (p) => formatDate(p.createdAt) },
              { key: "a", header: "", className: "text-right", render: (p) => (
                <div className="flex justify-end gap-2">
                  <Button size="sm" onClick={() => setApprove(p)}><Check className="h-4 w-4" />Approve</Button>
                  <Button size="sm" variant="secondary" onClick={() => { setReject(p); setReason(""); setErr(""); }}><X className="h-4 w-4" />Reject</Button>
                </div>
              ) },
            ]} />
        )}
      </AsyncView>
      <ConfirmDialog open={!!approve} title="Approve listing" confirmLabel="Approve and publish" onClose={() => setApprove(null)} message={approve && `Publish "${approve.title}" to the public site?`}
        onConfirm={async () => { if (approve && (await run(() => approveProperty(approve.id), "Listing published"))) state.reload(); }} />
      <Modal open={!!reject} onClose={() => setReject(null)} title="Reject listing"
        footer={<><Button variant="secondary" onClick={() => setReject(null)}>Cancel</Button><Button variant="danger" loading={busy} onClick={doReject}>Reject</Button></>}>
        <p className="mb-3 text-sm text-muted">{reject?.title}</p>
        <Textarea label="Reason" required value={reason} error={err} onChange={(e) => setReason(e.target.value)} hint="Shown to the owner so they can fix and resubmit." />
      </Modal>
    </div>
  );
}
