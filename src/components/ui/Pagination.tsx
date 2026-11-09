import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

/** URL-driven pagination: `hrefFor(page)` returns the link for a page number. */
export function Pagination({ page, pages, hrefFor }: { page: number; pages: number; hrefFor: (p: number) => string }) {
  if (pages <= 1) return null;
  const set = new Set([1, pages, page - 1, page, page + 1]);
  const nums = [...set].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const item = "flex h-10 min-w-10 items-center justify-center rounded border px-3 text-sm";
  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-1.5">
      {page > 1 && <Link href={hrefFor(page - 1)} aria-label="Previous page" className={cn(item, "border-line bg-white")}><ChevronLeft className="h-4 w-4" /></Link>}
      {nums.map((n, i) => (
        <span key={n} className="flex items-center gap-1.5">
          {i > 0 && n - nums[i - 1] > 1 && <span className="text-muted">…</span>}
          <Link href={hrefFor(n)} aria-current={n === page ? "page" : undefined} className={cn(item, n === page ? "border-forest bg-forest text-white" : "border-line bg-white hover:bg-ivory")}>{n}</Link>
        </span>
      ))}
      {page < pages && <Link href={hrefFor(page + 1)} aria-label="Next page" className={cn(item, "border-line bg-white")}><ChevronRight className="h-4 w-4" /></Link>}
    </nav>
  );
}
