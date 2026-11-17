"use client";
import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/Badge";
import { DataTable, PageHeader } from "@/components/ui/Misc";
import { AsyncView, SearchBox, downloadText, matches } from "@/components/admin/common";
import { useAsync } from "@/hooks/useAsync";
import { listPayments, paymentsToCsv } from "@/lib/services/admin";
import { formatDateTime, formatKES } from "@/lib/format";

export default function AdminPaymentsPage() {
  const state = useAsync(() => listPayments(500), []);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [purpose, setPurpose] = useState("");

  return (
    <div className="space-y-4">
      <PageHeader title="Payments" description="The 500 most recent M-Pesa transactions (read-only ledger)." />
      <AsyncView state={state}>
        {(rows) => {
          const shown = rows.filter((p) => (!status || p.status === status) && (!purpose || p.purpose === purpose) && matches(q, p.mpesaReceipt, p.phone, p.propertyTitle, p.userId, p.id));
          return (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <SearchBox value={q} onChange={setQ} placeholder="Receipt, phone, property" />
                <Select aria-label="Status" className="w-36" value={status} onChange={(e) => setStatus(e.target.value)} options={[{ value: "", label: "All statuses" }, ...["success", "pending", "failed", "cancelled"].map((s) => ({ value: s, label: s }))]} />
                <Select aria-label="Purpose" className="w-48" value={purpose} onChange={(e) => setPurpose(e.target.value)} options={[{ value: "", label: "All purposes" }, ...["contact-access", "landlord-registration", "boost"].map((s) => ({ value: s, label: s }))]} />
                <Button variant="secondary" size="sm" className="ml-auto" disabled={!shown.length} onClick={() => downloadText(`patakeja-payments-${new Date().toISOString().slice(0, 10)}.csv`, paymentsToCsv(shown))}><Download className="h-4 w-4" />Export CSV ({shown.length})</Button>
              </div>
              <DataTable rows={shown} rowKey={(p) => p.id} empty={<EmptyState title={rows.length ? "No matches" : "No payments yet"} />}
                columns={[
                  { key: "d", header: "Date", render: (p) => formatDateTime(p.createdAt) },
                  { key: "pu", header: "Purpose", render: (p) => <div><div className="capitalize">{p.purpose.replace(/-/g, " ")}</div>{p.propertyTitle && <div className="text-xs text-muted">{p.propertyTitle}</div>}</div> },
                  { key: "a", header: "Amount", render: (p) => formatKES(p.amount) },
                  { key: "ph", header: "Phone", render: (p) => p.phone },
                  { key: "r", header: "Receipt", render: (p) => p.mpesaReceipt || <span className="text-muted">{p.resultDesc || "-"}</span> },
                  { key: "s", header: "Status", render: (p) => <StatusBadge status={p.status} /> },
                ]} />
            </>
          );
        }}
      </AsyncView>
    </div>
  );
}
