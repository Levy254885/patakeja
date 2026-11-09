"use client";
import Link from "next/link";
import { Building2, CalendarClock, Eye, MessageSquare, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthProvider";
import { useAsync } from "@/hooks/useAsync";
import { LinkButton } from "@/components/ui/Button";
import { Card, MetricCard, PageHeader } from "@/components/ui/Misc";
import { StatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";
import { Loadable, useMyProperties } from "@/components/portal/common";
import { RegistrationGate } from "@/components/portal/RegistrationGate";
import { getInquiriesForOwner, getViewingsForOwner } from "@/lib/services/enquiries";
import { formatNumber, timeAgo } from "@/lib/format";

export default function PortalOverview() {
  const { user, profile } = useAuth();
  const uid = user?.uid ?? "";
  const props = useMyProperties();
  const enq = useAsync(() => getInquiriesForOwner(uid), [uid], !!uid);
  const view = useAsync(() => getViewingsForOwner(uid), [uid], !!uid);
  return (
    <>
      <PageHeader title={`Welcome${profile?.fullName ? ", " + profile.fullName.split(" ")[0] : ""}`} description="A snapshot of your listings and leads."
        action={<LinkButton href="/portal/properties/new"><Plus className="h-4 w-4" /> Add property</LinkButton>} />
      <RegistrationGate className="mb-6" />
      <Loadable state={props}>
        {(list) => {
          const live = list.filter((p) => p.status === "published");
          const views = list.reduce((s, p) => s + (p.stats?.views ?? 0), 0);
          const newEnq = enq.data?.filter((e) => e.status === "new").length;
          const pendView = view.data?.filter((v) => v.status === "pending").length;
          return (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <MetricCard label="Live listings" value={live.length} hint={`${list.length} in total`} icon={Building2} />
                <MetricCard label="Total views" value={formatNumber(views)} icon={Eye} />
                <MetricCard label="New enquiries" value={newEnq ?? "-"} icon={MessageSquare} />
                <MetricCard label="Pending viewings" value={pendView ?? "-"} icon={CalendarClock} />
              </div>
              {list.length === 0 ? (
                <div className="mt-6"><EmptyState icon={Building2} title="No properties yet" message="Add your first listing. You can save it as a draft and publish later." action={<LinkButton href="/portal/properties/new">Add property</LinkButton>} /></div>
              ) : (
                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <Card title="Recent properties" action={<Link href="/portal/properties" className="text-sm text-forest">View all</Link>}>
                    <ul className="divide-y divide-line">
                      {list.slice(0, 5).map((p) => (
                        <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                          <Link href={`/portal/properties/${p.id}/edit`} className="truncate text-charcoal hover:text-forest">{p.title}</Link>
                          <StatusBadge status={p.status} />
                        </li>
                      ))}
                    </ul>
                  </Card>
                  <Card title="Latest enquiries" action={<Link href="/portal/enquiries" className="text-sm text-forest">View all</Link>}>
                    {enq.data?.length ? (
                      <ul className="divide-y divide-line">
                        {enq.data.slice(0, 5).map((e) => (
                          <li key={e.id} className="py-2.5 text-sm">
                            <div className="flex justify-between gap-2"><span className="font-medium text-charcoal">{e.name}</span><span className="text-xs text-muted">{timeAgo(e.createdAt)}</span></div>
                            <p className="truncate text-muted">{e.propertyTitle}</p>
                          </li>
                        ))}
                      </ul>
                    ) : <p className="text-sm text-muted">{enq.loading ? "Loading..." : enq.error ?? "No enquiries yet."}</p>}
                  </Card>
                </div>
              )}
            </>
          );
        }}
      </Loadable>
    </>
  );
}
