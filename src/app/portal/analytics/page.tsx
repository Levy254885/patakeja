"use client";
import { BarChart3 } from "lucide-react";
import { useAuth } from "@/context/AuthProvider";
import { useAsync } from "@/hooks/useAsync";
import { Card, MetricCard, PageHeader } from "@/components/ui/Misc";
import { EmptyState } from "@/components/ui/States";
import { BarChart } from "@/components/charts/BarChart";
import { LineChart } from "@/components/charts/LineChart";
import { Donut } from "@/components/charts/Donut";
import { Loadable, useMyProperties } from "@/components/portal/common";
import { getInquiriesForOwner } from "@/lib/services/enquiries";
import { formatNumber } from "@/lib/format";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const uid = user?.uid ?? "";
  const props = useMyProperties();
  const enq = useAsync(() => getInquiriesForOwner(uid), [uid], !!uid);
  return (
    <>
      <PageHeader title="Analytics" description="Performance of your listings, from recorded views, saves and enquiries." />
      <Loadable state={props}>
        {(list) => {
          if (!list.length) return <EmptyState icon={BarChart3} title="No data yet" message="Statistics appear once you have listings with activity." />;
          const sum = (k: "views" | "enquiries" | "unlocks" | "saves") => list.reduce((s, p) => s + (p.stats?.[k] ?? 0), 0);
          const top = [...list].sort((a, b) => (b.stats?.views ?? 0) - (a.stats?.views ?? 0)).slice(0, 8);
          const statuses = [["published", "text-forest"], ["pending", "text-warning"], ["draft", "text-muted"], ["rejected", "text-danger"], ["archived", "text-line"]] as const;
          // Enquiries per month for the last 6 months, from real enquiry documents.
          const now = new Date();
          const months = Array.from({ length: 6 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - 5 + i, 1));
          const series = months.map((m) => ({
            label: m.toLocaleString("en-KE", { month: "short" }),
            value: (enq.data ?? []).filter((e) => e.createdAt && new Date(e.createdAt).getFullYear() === m.getFullYear() && new Date(e.createdAt).getMonth() === m.getMonth()).length,
          }));
          return (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <MetricCard label="Views" value={formatNumber(sum("views"))} />
                <MetricCard label="Enquiries" value={formatNumber(sum("enquiries"))} />
                <MetricCard label="Contact unlocks" value={formatNumber(sum("unlocks"))} />
                <MetricCard label="Saves" value={formatNumber(sum("saves"))} />
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <Card title="Views by listing (top 8)"><BarChart title="Views by listing" data={top.map((p) => ({ label: p.title, value: p.stats?.views ?? 0 }))} /></Card>
                <Card title="Listings by status"><Donut title="Listings by status" centerLabel="listings" data={statuses.map(([s, tone]) => ({ label: s[0].toUpperCase() + s.slice(1), value: list.filter((p) => p.status === s).length, tone }))} /></Card>
                <Card title="Enquiries per month" className="lg:col-span-2">
                  {enq.loading ? <p className="text-sm text-muted">Loading...</p> : enq.error ? <p className="text-sm text-danger">{enq.error}</p> : <LineChart title="Enquiries per month" data={series} />}
                </Card>
              </div>
            </div>
          );
        }}
      </Loadable>
    </>
  );
}
