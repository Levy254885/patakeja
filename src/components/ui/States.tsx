import { AlertTriangle, Inbox } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

export const Skeleton = ({ className }: { className?: string }) => <div className={cn("animate-pulse rounded bg-ivory", className)} aria-hidden />;

export function EmptyState({ icon: Icon = Inbox, title, message, action }: { icon?: React.ComponentType<{ className?: string }>; title: string; message?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded border border-dashed border-line bg-white px-6 py-12 text-center">
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-ivory text-forest"><Icon className="h-5 w-5" /></span>
      <h3 className="font-heading text-base font-semibold text-charcoal">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded border border-danger/30 bg-danger/5 px-6 py-10 text-center">
      <AlertTriangle className="mb-2 h-6 w-6 text-danger" />
      <p className="text-sm font-medium text-charcoal">Something went wrong</p>
      <p className="mt-1 max-w-md text-sm text-muted">{message ?? "Please try again in a moment."}</p>
      {onRetry && <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export const Spinner = () => <div className="flex justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-forest" /></div>;

/** Shown when Firebase environment variables are missing. */
export function NotConfigured() {
  return (
    <div className="rounded border border-warning/40 bg-warning/10 p-4 text-sm text-charcoal">
      <p className="font-medium">Firebase is not configured.</p>
      <p className="mt-1 text-muted">Copy <code>.env.example</code> to <code>.env.local</code> and add your Firebase web app settings, then restart the dev server.</p>
    </div>
  );
}
