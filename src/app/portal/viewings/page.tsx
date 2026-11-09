"use client";
import { CalendarClock } from "lucide-react";
import { useAuth } from "@/context/AuthProvider";
import { useAsync } from "@/hooks/useAsync";
import { PageHeader } from "@/components/ui/Misc";
import { EmptyState } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Loadable } from "@/components/portal/common";
import { getViewingsForOwner, setViewingStatus } from "@/lib/services/enquiries";
import { formatDate } from "@/lib/format";
import type { AppointmentStatus } from "@/lib/types";

export default function ViewingsPage() {
  const { user } = useAuth();
  const uid = user?.uid ?? "";
  const s = useAsync(() => getViewingsForOwner(uid), [uid], !!uid);
  const toast = useToast();
  const update = async (id: string, st: AppointmentStatus) => {
    try { await setViewingStatus(id, st); s.setData((s.data ?? []).map((v) => (v.id === id ? { ...v, status: st } : v))); toast.success("Viewing updated."); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not update."); }
  };
  return (
    <>
      <PageHeader title="Viewing requests" description="Confirm or decline the times people ask for." />
      <Loadable state={s}>
        {(rows) => rows.length === 0 ? <EmptyState icon={CalendarClock} title="No viewing requests" message="Requests from tenants will appear here." /> : (
          <ul className="space-y-3">
            {rows.map((v) => (
              <li key={v.id} className="rounded border border-line bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div><p className="font-heading text-sm font-semibold text-charcoal">{v.name}</p><p className="text-xs text-muted">{v.propertyTitle}</p></div>
                  <StatusBadge status={v.status} />
                </div>
                <p className="mt-2 text-sm text-charcoal">{formatDate(new Date(v.preferredDate).getTime())} at {v.preferredTime}</p>
                {v.message && <p className="mt-1 whitespace-pre-line text-sm text-muted">{v.message}</p>}
                <p className="mt-2 text-sm"><a href={`tel:${v.phone}`} className="text-forest">{v.phone}</a>{v.email && <> | <a href={`mailto:${v.email}`} className="text-forest">{v.email}</a></>}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {v.status === "pending" && <><Button size="sm" onClick={() => update(v.id, "confirmed")}>Confirm</Button><Button size="sm" variant="secondary" onClick={() => update(v.id, "declined")}>Decline</Button></>}
                  {v.status === "confirmed" && <Button size="sm" variant="secondary" onClick={() => update(v.id, "completed")}>Mark completed</Button>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Loadable>
    </>
  );
}
