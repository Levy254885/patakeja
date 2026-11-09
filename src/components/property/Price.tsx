import { formatKES } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { ListingType } from "@/lib/types";

export function Price({ amount, listingType, className }: { amount: number; listingType: ListingType; className?: string }) {
  return (
    <span className={cn("font-heading font-semibold text-forest", className)}>
      {formatKES(amount)}{listingType === "rent" && <span className="text-sm font-normal text-muted"> /month</span>}
    </span>
  );
}
