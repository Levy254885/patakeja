"use client";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { useAuth } from "@/context/AuthProvider";
import { useAsync } from "@/hooks/useAsync";
import { PageHeader } from "@/components/ui/Misc";
import { EmptyState } from "@/components/ui/States";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Loadable } from "@/components/account/parts";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/services/notifications";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { AppNotification } from "@/lib/types";

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const uid = user?.uid ?? "";
  const s = useAsync(() => getNotifications(uid, 100), [uid], !!uid);

  const open = async (n: AppNotification) => {
    if (!n.read) {
      s.setData((s.data ?? []).map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      markNotificationRead(n.id).catch(() => undefined);
    }
    if (n.link) router.push(n.link);
  };
  const markAll = async () => {
    try {
      await markAllNotificationsRead(uid);
      s.setData((s.data ?? []).map((x) => ({ ...x, read: true })));
      toast.success("All notifications marked as read.");
    } catch {
      toast.error("Could not update notifications.");
    }
  };
  const unread = s.data?.filter((n) => !n.read).length ?? 0;

  return (
    <>
      <PageHeader title="Notifications" description="Updates about your enquiries, viewings and payments."
        action={unread > 0 ? <Button variant="outline" size="sm" onClick={markAll}>Mark all as read</Button> : undefined} />
      <Loadable state={s}>
        {(rows) => rows.length ? (
          <ul className="space-y-2">
            {rows.map((n) => (
              <li key={n.id}>
                <button onClick={() => open(n)} className={cn("w-full rounded border p-4 text-left hover:border-forest", n.read ? "border-line bg-white" : "border-forest/30 bg-forest-50")}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-charcoal">{!n.read && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-forest align-middle" aria-label="Unread" />}{n.title}</p>
                    <span className="shrink-0 text-xs text-muted">{timeAgo(n.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted">{n.body}</p>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={Bell} title="No notifications" message="You will be notified here when something happens on your account." />
        )}
      </Loadable>
    </>
  );
}
