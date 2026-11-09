"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { useAuth } from "@/context/AuthProvider";
import { useAsync } from "@/hooks/useAsync";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/Badge";
import { Loadable, PURPOSE_LABEL } from "@/components/account/parts";
import { getPayment } from "@/lib/services/payments";
import { formatDateTime, formatKES } from "@/lib/format";

export default function ReceiptPage() {
  const params = useParams();
  const id = String(params?.id ?? "");
  const { user, profile } = useAuth();
  const uid = user?.uid ?? "";
  const s = useAsync(() => getPayment(id), [id], !!uid && !!id);
  const loaded = s.data !== null || (!s.loading && !s.error);

  return (
    <>
      <style>{`@media print { aside, header, nav, .no-print { display: none !important; } .lg\\:pl-60 { padding-left: 0 !important; } body, .bg-ivory { background: #fff !important; } }`}</style>
      <div className="no-print mb-4 flex items-center justify-between">
        <Link href="/account/payments" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-forest"><ArrowLeft className="h-4 w-4" />All payments</Link>
        <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" />Print receipt</Button>
      </div>
      <Loadable state={s} rows={1}>
        {(p) => (!p || p.userId !== uid ? (
          <EmptyState title="Receipt not found" message="This payment does not belong to your account." />
        ) : (
          <article className="mx-auto max-w-xl rounded border border-line bg-white p-6 sm:p-8">
            <header className="flex items-start justify-between gap-4 border-b border-line pb-4">
              <div>
                <p className="font-heading text-xl font-semibold text-forest">PataKeja</p>
                <p className="text-xs text-muted">{p.status === "success" ? "Payment receipt" : "Payment record"}</p>
              </div>
              <StatusBadge status={p.status} />
            </header>
            <dl className="mt-4 divide-y divide-line text-sm">
              {[
                ["Receipt for", PURPOSE_LABEL[p.purpose] ?? p.purpose],
                ...(p.propertyTitle ? [["Property", p.propertyTitle]] : []),
                ["Amount", formatKES(p.amount)],
                ["Paid by", profile?.fullName ?? user?.email ?? "-"],
                ["M-Pesa number", p.phone],
                ["M-Pesa receipt no.", p.mpesaReceipt ?? "Not issued"],
                ["Started", formatDateTime(p.createdAt)],
                ...(p.completedAt ? [["Completed", formatDateTime(p.completedAt)]] : []),
                ["Reference", p.id],
                ...(p.status !== "success" && p.resultDesc ? [["Result", p.resultDesc]] : []),
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2.5"><dt className="text-muted">{k}</dt><dd className="break-all text-right font-medium text-charcoal">{v}</dd></div>
              ))}
            </dl>
            {p.status !== "success" && <p className="mt-4 text-xs text-muted">This payment did not complete, so no receipt applies. If money left your M-Pesa account, contact support with this reference.</p>}
          </article>
        ))}
      </Loadable>
      {!loaded && null}
    </>
  );
}
