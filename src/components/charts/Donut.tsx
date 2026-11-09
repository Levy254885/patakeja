import { cn } from "@/lib/cn";

export interface Slice { label: string; value: number; /** Tailwind text colour class, e.g. "text-forest" */ tone: string }

/** Donut chart with a legend. Slices with a zero value are omitted from the ring but still listed. */
export function Donut({ data, title, className, centerLabel }: { data: Slice[]; title: string; className?: string; centerLabel?: string }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = 54, c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <figure className={cn("flex flex-wrap items-center gap-6", className)}>
      <svg viewBox="0 0 140 140" role="img" aria-label={title} className="h-36 w-36 shrink-0">
        <title>{title}</title>
        <circle cx={70} cy={70} r={r} fill="none" className="stroke-ivory" strokeWidth={18} />
        {total > 0 && data.filter((d) => d.value > 0).map((d) => {
          const len = (d.value / total) * c;
          const el = (
            <circle key={d.label} cx={70} cy={70} r={r} fill="none" stroke="currentColor" className={d.tone} strokeWidth={18}
              strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} transform="rotate(-90 70 70)">
              <title>{`${d.label}: ${d.value}`}</title>
            </circle>
          );
          offset += len;
          return el;
        })}
        <text x={70} y={68} textAnchor="middle" fontSize={22} fontWeight={600} className="fill-charcoal">{total}</text>
        <text x={70} y={86} textAnchor="middle" fontSize={10} className="fill-muted">{centerLabel ?? "total"}</text>
      </svg>
      <ul className="space-y-1.5 text-sm">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2">
            <span className={cn("inline-block h-2.5 w-2.5 rounded-sm bg-current", d.tone)} aria-hidden />
            <span className="text-charcoal">{d.label}</span>
            <span className="text-muted">{d.value}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
