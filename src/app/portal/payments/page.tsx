"use client";
import { CreditCard } from "lucide-react";
import { useAuth } from "@/context/AuthProvider";
import { useAsync } from "@/hooks/useAsync";
import { DataTable, PageHeader } from "@/components/ui/Misc";
import { EmptyState } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/Badge";
import { Loadable, PURPOSE_LABEL } from "@/components/portal/common";
import { RegistrationGate } from "@/components/portal/RegistrationGate";
import { getMyPayments } from "@/lib/services/payments";
import { formatDateTime, formatKES } from "@/lib/format";

export default function PaymentsPage() {
  const { user } = useAuth();
  const uid = user?.uid ?? "";
  const s = useAsync(() => getMyPayments(uid), [uid], !!uid);
  return (
    <>
      <PageHeader title="Payments" description="Your M-Pesa payments for registration and boosts." />
      <RegistrationGate className="mb-6" />
      <Loadable state={s}>
        {(rows) => (
          <DataTable rows={rows} rowKey={(p) => p.id} empty={<EmptyState icon={CreditCard} title="No payments yet" message="Receipts for registration and boosts appear here." />}
            columns={[
              { key: "d", header: "Date", render: (p) => formatDateTime(p.createdAt) },
              { key: "p", header: "For", render: (p) => <>{PURPOSE_LABEL[p.purpose] ?? p.purpose}{p.propertyTitle && <span className="block text-xs text-muted">{p.propertyTitle}</span>}</> },
              { key: "a", header: "Amount", render: (p) => formatKES(p.amount) },
              { key: "r", header: "M-Pesa receipt", render: (p) => p.mpesaReceipt ?? "-" },
              { key: "s", header: "Status", render: (p) => <StatusBadge status={p.status} /> },
            ]} />
        )}
      </Loadable>
    </>
  );
}
