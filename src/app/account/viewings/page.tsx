"use client";
import { useState } from "react";
import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { useAuth } from "@/context/AuthProvider";
import { useAsync } from "@/hooks/useAsync";
import { PageHeader } from "@/components/ui/Misc";
import { EmptyState } from "@/components/ui/States";
import { Button, LinkButton } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { Loadable } from "@/components/account/parts";
import { cancelViewing, getViewingsForCustomer } from "@/lib/services/enquiries";
import { formatDate } from "@/lib/format";
import type { ViewingAppointment } from "@/lib/types";

export default function ViewingsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const uid = user?.uid ?? "";
  const s = useAsync(() => getViewingsForCustomer(uid), [uid], !!uid);
  const [target, setTarget] = useState<ViewingAppointment | null>(null);

  const doCancel = async () => {
    if (!target) return;
    try {
      await cancelViewing(target.id);
      toast.success("Viewing request cancelled.");
      s.reload();
    } catch {
      toast.error("Could not cancel this request. Please try again.");
      throw new Error("cancel failed");
    }
  };

  return (
    <>
      <PageHeader title="Viewing requests" description="The landlord or agent confirms or declines each request." />
      <Loadable state={s}>
        {(rows) => rows.length ? (
          <ul className="space-y-3">
            {rows.map((v) => (
              <li key={v.id} className="rounded border border-line bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <Link href={`/property/${v.propertyId}`} className="font-heading text-sm font-semibold text-charcoal hover:text-forest">{v.propertyTitle}</Link>
                  <StatusBadge status={v.status} />
                </div>
                <p className="mt-2 text-sm text-charcoal">Preferred: {formatDate(new Date(v.preferredDate + "T00:00:00").getTime(), { weekday: "short", day: "numeric", month: "short", year: "numeric" })} at {v.preferredTime}</p>
                {v.message && <p className="mt-1 text-sm text-muted">{v.message}</p>}
                {(v.status === "pending" || v.status === "confirmed") && (
                  <div className="mt-3"><Button variant="outline" size="sm" onClick={() => setTarget(v)}>Cancel request</Button></div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={CalendarClock} title="No viewing requests" message="Request a viewing from any listing page and track it here." action={<LinkButton href="/search">Find a place</LinkButton>} />
        )}
      </Loadable>
      <ConfirmDialog open={!!target} onClose={() => setTarget(null)} title="Cancel this viewing request?" danger confirmLabel="Cancel request"
        message={<>Your request to view <strong>{target?.propertyTitle}</strong> will be cancelled. You can send a new request later.</>} onConfirm={doCancel} />
    </>
  );
}
