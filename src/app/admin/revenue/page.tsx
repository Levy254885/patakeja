"use client";
import { Banknote, CreditCard, TrendingUp } from "lucide-react";
import { BarChart } from "@/components/charts/BarChart";
import { Donut } from "@/components/charts/Donut";
import { LineChart } from "@/components/charts/LineChart";
import { Card, MetricCard, PageHeader } from "@/components/ui/Misc";
import { EmptyState } from "@/components/ui/States";
import { AsyncView } from "@/components/admin/common";
import { useAsync } from "@/hooks/useAsync";
import { listSuccessfulPayments } from "@/lib/services/admin";
import { formatKES, formatPriceShort } from "@/lib/format";

const PURPOSES = [
  { key: "contact-access", label: "Contact access", tone: "text-forest" },
  { key: "landlord-registration", label: "Landlord registration", tone: "text-gold" },
  { key: "boost", label: "Boosts", tone: "text-warning" },
] as const;

export default function AdminRevenuePage() {
  const state = useAsync(() => listSuccessfulPayments(5000), []);
  return (
    <div className="space-y-6">
      <PageHeader title="Revenue" description="Calculated from successful payments (up to the latest 5,000)." />
      <AsyncView state={state}>
        {(rows) => {
          if (!rows.length) return <EmptyState icon={CreditCard} title="No revenue yet" message="Charts appear once the first M-Pesa payment succeeds." />;
          const total = rows.reduce((s, p) => s + p.amount, 0);
          const months = new Map<string, number>();
          const days = new Map<string, number>();
          const now = Date.now();
          for (const p of rows) {
            const d = new Date(p.completedAt ?? p.createdAt ?? 0);
            if (!d.getTime()) continue;
            const m = d.toISOString().slice(0, 7);
            months.set(m, (months.get(m) ?? 0) + p.amount);
            if (now - d.getTime() < 14 * 864e5) { const k = d.toISOString().slice(5, 10); days.set(k, (days.get(k) ?? 0) + p.amount); }
          }
          const monthData = [...months.entries()].sort().map(([label, value]) => ({ label, value }));
          const dayData = [...days.entries()].sort().map(([label, value]) => ({ label, value }));
          const byPurpose = PURPOSES.map((x) => ({ label: x.label, tone: x.tone, value: rows.filter((p) => p.purpose === x.key).reduce((s, p) => s + p.amount, 0) }));
          return (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                <MetricCard label="Total revenue" value={formatKES(total)} icon={Banknote} />
                <MetricCard label="Payments" value={rows.length} icon={CreditCard} />
                <MetricCard label="Average payment" value={formatKES(Math.round(total / rows.length))} icon={TrendingUp} />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <Card title="Revenue by month"><LineChart title="Revenue by month" data={monthData} format={formatPriceShort} /></Card>
                <Card title="By purpose"><Donut title="Revenue by purpose" data={byPurpose} centerLabel={formatPriceShort(total)} /></Card>
              </div>
              <Card title="Last 14 days (days with revenue only)">
                {dayData.length ? <BarChart title="Daily revenue" data={dayData} format={formatPriceShort} /> : <p className="text-sm text-muted">No revenue in the last 14 days.</p>}
              </Card>
            </>
          );
        }}
      </AsyncView>
    </div>
  );
}
