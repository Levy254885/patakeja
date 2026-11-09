"use client";
import Link from "next/link";
import { Receipt } from "lucide-react";
import { useAuth } from "@/context/AuthProvider";
import { useAsync } from "@/hooks/useAsync";
import { DataTable, PageHeader } from "@/components/ui/Misc";
import { EmptyState } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/Badge";
import { Loadable, PURPOSE_LABEL } from "@/components/account/parts";
import { getMyPayments } from "@/lib/services/payments";
import { formatDateTime, formatKES } from "@/lib/format";

export default function PaymentsPage() {
  const { user } = useAuth();
  const uid = user?.uid ?? "";
  const s = useAsync(() => getMyPayments(uid), [uid], !!uid);
  return (
    <>
      <PageHeader title="Payments & receipts" description="Your M-Pesa payments. Open a successful payment to view and print a receipt." />
      <Loadable state={s}>
        {(rows) => (
          <DataTable rows={rows} rowKey={(p) => p.id}
            empty={<EmptyState icon={Receipt} title="No payments yet" message="Payments for contact access will be listed here with their M-Pesa receipt numbers." />}
            columns={[
              { key: "date", header: "Date", render: (p) => formatDateTime(p.createdAt) },
              { key: "for", header: "For", render: (p) => <div><p className="font-medium text-charcoal">{PURPOSE_LABEL[p.purpose] ?? p.purpose}</p>{p.propertyTitle && <p className="max-w-[220px] truncate text-xs text-muted">{p.propertyTitle}</p>}</div> },
              { key: "amount", header: "Amount", render: (p) => formatKES(p.amount) },
              { key: "receipt", header: "M-Pesa receipt", render: (p) => p.mpesaReceipt ?? <span className="text-muted">-</span> },
              { key: "status", header: "Status", render: (p) => <StatusBadge status={p.status} /> },
              { key: "open", header: "", render: (p) => <Link href={`/account/payments/${p.id}`} className="text-sm font-medium text-forest hover:underline">{p.status === "success" ? "Receipt" : "Details"}</Link> },
            ]} />
        )}
      </Loadable>
    </>
  );
}
