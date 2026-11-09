"use client";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useAuth } from "@/context/AuthProvider";
import { useAsync } from "@/hooks/useAsync";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/Misc";
import { EmptyState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { Loadable } from "@/components/portal/common";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/services/notifications";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";

export default function NotificationsPage() {
  const { user } = useAuth();
  const uid = user?.uid ?? "";
  const toast = useToast();
  const s = useAsync(() => getNotifications(uid), [uid], !!uid);
  const readAll = async () => { try { await markAllNotificationsRead(uid); s.reload(); } catch (e) { toast.error(e instanceof Error ? e.message : "Could not update."); } };
  const readOne = (id: string) => { markNotificationRead(id).then(() => s.setData((s.data ?? []).map((n) => (n.id === id ? { ...n, read: true } : n)))).catch(() => undefined); };
  return (
    <>
      <PageHeader title="Notifications" action={<Button variant="secondary" size="sm" onClick={readAll}>Mark all read</Button>} />
      <Loadable state={s}>
        {(rows) => !rows.length ? <EmptyState icon={Bell} title="No notifications" message="Updates about enquiries, payments and listing reviews appear here." /> : (
          <ul className="divide-y divide-line rounded border border-line bg-white">
            {rows.map((n) => (
              <li key={n.id} className={cn("p-4 text-sm", !n.read && "bg-ivory")} onClick={() => !n.read && readOne(n.id)}>
                <div className="flex justify-between gap-2"><p className="font-medium text-charcoal">{n.title}</p><span className="shrink-0 text-xs text-muted">{timeAgo(n.createdAt)}</span></div>
                <p className="mt-0.5 text-muted">{n.body}</p>
                {n.link && <Link href={n.link} className="mt-1 inline-block text-forest">Open</Link>}
              </li>
            ))}
          </ul>
        )}
      </Loadable>
    </>
  );
}
