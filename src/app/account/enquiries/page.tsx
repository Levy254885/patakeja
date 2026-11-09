"use client";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { useAuth } from "@/context/AuthProvider";
import { useAsync } from "@/hooks/useAsync";
import { PageHeader } from "@/components/ui/Misc";
import { EmptyState } from "@/components/ui/States";
import { LinkButton } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Loadable } from "@/components/account/parts";
import { getInquiriesForCustomer } from "@/lib/services/enquiries";
import { formatDateTime } from "@/lib/format";

export default function EnquiriesPage() {
  const { user } = useAuth();
  const uid = user?.uid ?? "";
  const s = useAsync(() => getInquiriesForCustomer(uid), [uid], !!uid);
  return (
    <>
      <PageHeader title="My enquiries" description="Messages you sent to landlords and agents. Replies come by phone or email, using the details you provided." />
      <Loadable state={s}>
        {(rows) => rows.length ? (
          <ul className="space-y-3">
            {rows.map((e) => (
              <li key={e.id} className="rounded border border-line bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <Link href={`/property/${e.propertyId}`} className="font-heading text-sm font-semibold text-charcoal hover:text-forest">{e.propertyTitle}</Link>
                  <StatusBadge status={e.status} />
                </div>
                <p className="mt-2 whitespace-pre-line text-sm text-charcoal">{e.message}</p>
                <p className="mt-2 text-xs text-muted">Sent {formatDateTime(e.createdAt)} as {e.name}, {e.phone}</p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={MessageSquare} title="No enquiries yet" message="Use the enquiry form on a listing to message the landlord or agent." action={<LinkButton href="/search">Find a place</LinkButton>} />
        )}
      </Loadable>
    </>
  );
}
