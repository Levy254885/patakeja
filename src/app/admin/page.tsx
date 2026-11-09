"use client";
import Link from "next/link";
import { Building2, ClipboardCheck, CreditCard, Flag, LifeBuoy, Users, BadgeCheck, MessageSquare } from "lucide-react";
import { Card, DataTable, MetricCard, PageHeader } from "@/components/ui/Misc";
import { EmptyState } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/Badge";
import { Donut } from "@/components/charts/Donut";
import { AsyncView } from "@/components/admin/common";
import { useAsync } from "@/hooks/useAsync";
import { getOverview, PUBLISH_STATUSES, ROLES } from "@/lib/services/admin";
import { formatDate, formatKES, formatNumber } from "@/lib/format";

const statusTone: Record<string, string> = { published: "text-success", pending: "text-warning", draft: "text-muted", rejected: "text-danger", archived: "text-line" };
const roleTone: Record<string, string> = { superAdmin: "text-forest", admin: "text-gold", agent: "text-warning", landlord: "text-success", customer: "text-muted" };

export default function AdminOverviewPage() {
  const state = useAsync(getOverview, []);
  return (
    <div className="space-y-6">
      <PageHeader title="Overview" description="Live counts from Firestore." />
      <AsyncView state={state}>
        {(o) => {
          const users = ROLES.reduce((s, r) => s + o.usersByRole[r], 0);
          const props = PUBLISH_STATUSES.reduce((s, r) => s + o.listingsByStatus[r], 0);
          return (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <MetricCard label="Users" value={formatNumber(users)} icon={Users} />
                <MetricCard label="Properties" value={formatNumber(props)} hint={`${o.listingsByStatus.pending} awaiting approval`} icon={Building2} />
                <MetricCard label="Revenue" value={formatKES(o.revenue)} hint={`${o.successfulPayments} successful payments`} icon={CreditCard} />
                <MetricCard label="Enquiries" value={formatNumber(o.enquiries)} hint={`${o.newEnquiries} new`} icon={MessageSquare} />
              </div>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  { href: "/admin/approvals", label: "Pending approvals", v: o.listingsByStatus.pending, icon: ClipboardCheck },
                  { href: "/admin/verification", label: "Pending verifications", v: o.pendingVerifications, icon: BadgeCheck },
                  { href: "/admin/reports", label: "Open reports", v: o.openReports, icon: Flag },
                  { href: "/admin/tickets", label: "Open tickets", v: o.openTickets, icon: LifeBuoy },
                ].map((x) => (
                  <Link key={x.href} href={x.href} className="block rounded border border-line bg-white p-4 hover:border-forest">
                    <div className="flex items-center justify-between text-sm text-muted">{x.label}<x.icon className="h-4 w-4 text-forest" /></div>
                    <div className="mt-2 font-heading text-2xl font-semibold">{x.v}</div>
                  </Link>
                ))}
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <Card title="Listings by status"><Donut title="Listings by status" centerLabel={String(props)} data={PUBLISH_STATUSES.map((s) => ({ label: s, value: o.listingsByStatus[s], tone: statusTone[s] }))} /></Card>
                <Card title="Users by role"><Donut title="Users by role" centerLabel={String(users)} data={ROLES.map((r) => ({ label: r, value: o.usersByRole[r], tone: roleTone[r] }))} /></Card>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <Card title="Newest users">
                  <DataTable rows={o.recentUsers} rowKey={(u) => u.uid ?? u.email} empty={<EmptyState title="No users yet" />}
                    columns={[{ key: "n", header: "Name", render: (u) => u.fullName || u.email }, { key: "r", header: "Role", render: (u) => <StatusBadge status={u.role} /> }, { key: "d", header: "Joined", render: (u) => formatDate(u.createdAt) }]} />
                </Card>
                <Card title="Recent payments">
                  <DataTable rows={o.recentPayments} rowKey={(p) => p.id} empty={<EmptyState title="No payments yet" />}
                    columns={[{ key: "a", header: "Amount", render: (p) => formatKES(p.amount) }, { key: "p", header: "Purpose", render: (p) => p.purpose }, { key: "s", header: "Status", render: (p) => <StatusBadge status={p.status} /> }]} />
                </Card>
              </div>
            </>
          );
        }}
      </AsyncView>
    </div>
  );
}
