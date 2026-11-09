"use client";
import { MessageSquare } from "lucide-react";
import { useAuth } from "@/context/AuthProvider";
import { useAsync } from "@/hooks/useAsync";
import { PageHeader } from "@/components/ui/Misc";
import { EmptyState } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { Loadable } from "@/components/portal/common";
import { getInquiriesForOwner, setInquiryStatus } from "@/lib/services/enquiries";
import { formatDateTime } from "@/lib/format";
import type { InquiryStatus } from "@/lib/types";

export default function EnquiriesPage() {
  const { user } = useAuth();
  const uid = user?.uid ?? "";
  const s = useAsync(() => getInquiriesForOwner(uid), [uid], !!uid);
  const toast = useToast();
  const update = async (id: string, st: InquiryStatus) => {
    try { await setInquiryStatus(id, st); s.setData((s.data ?? []).map((e) => (e.id === id ? { ...e, status: st } : e))); toast.success("Status updated."); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not update."); }
  };
  return (
    <>
      <PageHeader title="Enquiries" description="Messages from people interested in your properties." />
      <Loadable state={s}>
        {(rows) => rows.length === 0 ? <EmptyState icon={MessageSquare} title="No enquiries yet" message="They will appear here as soon as someone messages you about a listing." /> : (
          <ul className="space-y-3">
            {rows.map((e) => (
              <li key={e.id} className="rounded border border-line bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div><p className="font-heading text-sm font-semibold text-charcoal">{e.name}</p><p className="text-xs text-muted">re: {e.propertyTitle} - {formatDateTime(e.createdAt)}</p></div>
                  <StatusBadge status={e.status} />
                </div>
                <p className="mt-2 whitespace-pre-line text-sm text-charcoal">{e.message}</p>
                <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                  <p className="text-sm"><a href={`tel:${e.phone}`} className="text-forest">{e.phone}</a>{e.email && <> | <a href={`mailto:${e.email}`} className="text-forest">{e.email}</a></>}</p>
                  <Select aria-label="Status" className="w-36" value={e.status} onChange={(ev) => update(e.id, ev.target.value as InquiryStatus)}
                    options={[{ value: "new", label: "New" }, { value: "contacted", label: "Contacted" }, { value: "closed", label: "Closed" }]} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Loadable>
    </>
  );
}
