"use client";
import Link from "next/link";
import { Bell, CalendarClock, Heart, KeyRound, MessageSquare, Receipt } from "lucide-react";
import { useAuth } from "@/context/AuthProvider";
import { useAsync } from "@/hooks/useAsync";
import { Card, MetricCard, PageHeader } from "@/components/ui/Misc";
import { EmptyState, Skeleton } from "@/components/ui/States";
import { LinkButton } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { getSavedIds } from "@/lib/services/saved";
import { getInquiriesForCustomer, getViewingsForCustomer } from "@/lib/services/enquiries";
import { getMyPayments, getMyUnlocks } from "@/lib/services/payments";
import { getNotifications } from "@/lib/services/notifications";
import { formatKES, timeAgo } from "@/lib/format";
import { PURPOSE_LABEL } from "@/components/account/parts";

interface Activity { key: string; at: number; label: string; detail: string; href: string; status?: string }
interface Overview { saved: number | null; enquiries: number | null; viewings: number | null; unlocks: number | null; unread: number | null; activity: Activity[] }

const val = <T,>(r: PromiseSettledResult<T>): T | null => (r.status === "fulfilled" ? r.value : null);

async function load(uid: string): Promise<Overview> {
  const [saved, enq, view, unl, pay, notes] = await Promise.allSettled([
    getSavedIds(uid), getInquiriesForCustomer(uid), getViewingsForCustomer(uid), getMyUnlocks(uid), getMyPayments(uid), getNotifications(uid, 20),
  ]);
  const activity: Activity[] = [];
  val(enq)?.forEach((e) => activity.push({ key: `e${e.id}`, at: e.createdAt ?? 0, label: "Enquiry sent", detail: e.propertyTitle, href: "/account/enquiries", status: e.status }));
  val(view)?.forEach((v) => activity.push({ key: `v${v.id}`, at: v.createdAt ?? 0, label: "Viewing requested", detail: v.propertyTitle, href: "/account/viewings", status: v.status }));
  val(pay)?.forEach((p) => activity.push({ key: `p${p.id}`, at: p.createdAt ?? 0, label: `${PURPOSE_LABEL[p.purpose] ?? "Payment"} - ${formatKES(p.amount)}`, detail: p.propertyTitle ?? "", href: `/account/payments/${p.id}`, status: p.status }));
  const n = val(notes);
  return {
    saved: val(saved)?.length ?? null,
    enquiries: val(enq)?.length ?? null,
    viewings: val(view)?.length ?? null,
    unlocks: val(unl)?.length ?? null,
    unread: n ? n.filter((x) => !x.read).length : null,
    activity: activity.sort((a, b) => b.at - a.at).slice(0, 8),
  };
}

export default function AccountOverview() {
  const { user, profile } = useAuth();
  const uid = user?.uid ?? "";
  const s = useAsync(() => load(uid), [uid], !!uid);
  const d = s.data;
  const show = (n: number | null | undefined) => (n == null ? "-" : n);

  return (
    <>
      <PageHeader title={`Welcome${profile?.fullName ? `, ${profile.fullName.split(" ")[0]}` : ""}`} description="Your saved homes, enquiries and payments in one place." action={<LinkButton href="/search" variant="outline" size="sm">Search properties</LinkButton>} />
      {s.loading && !d ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/account/saved"><MetricCard label="Saved properties" value={show(d?.saved)} icon={Heart} /></Link>
          <Link href="/account/enquiries"><MetricCard label="Enquiries sent" value={show(d?.enquiries)} icon={MessageSquare} /></Link>
          <Link href="/account/viewings"><MetricCard label="Viewing requests" value={show(d?.viewings)} icon={CalendarClock} /></Link>
          <Link href="/account/unlocked"><MetricCard label="Unlocked contacts" value={show(d?.unlocks)} icon={KeyRound} /></Link>
          <Link href="/account/notifications"><MetricCard label="Unread notifications" value={show(d?.unread)} hint="Among your latest 20" icon={Bell} /></Link>
          <Link href="/account/payments"><MetricCard label="Payments & receipts" value="View" icon={Receipt} /></Link>
        </div>
      )}
      <Card title="Recent activity" className="mt-6">
        {s.loading && !d ? <Skeleton className="h-24 w-full" /> : s.error ? (
          <p className="text-sm text-danger">Could not load activity. {s.error}</p>
        ) : !d?.activity.length ? (
          <EmptyState title="No activity yet" message="When you send an enquiry, request a viewing or unlock a contact, it will show up here." action={<LinkButton href="/search" size="sm">Find a place</LinkButton>} />
        ) : (
          <ul className="divide-y divide-line">
            {d.activity.map((a) => (
              <li key={a.key}>
                <Link href={a.href} className="flex items-center justify-between gap-3 py-3 hover:bg-ivory/60">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-charcoal">{a.label}</p>
                    <p className="truncate text-xs text-muted">{a.detail}{a.detail && " - "}{timeAgo(a.at)}</p>
                  </div>
                  {a.status && <StatusBadge status={a.status} />}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
