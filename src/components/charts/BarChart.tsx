import { cn } from "@/lib/cn";

export interface Bar { label: string; value: number }

/** Horizontal bar chart (labels stay readable for long listing titles). Values are drawn exactly as given. */
export function BarChart({ data, title, className, format = (n: number) => String(n) }: { data: Bar[]; title: string; className?: string; format?: (n: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const rowH = 34, labelW = 150, W = 600, valueW = 56;
  const H = data.length * rowH + 4;
  const trunc = (s: string) => (s.length > 24 ? s.slice(0, 23) + "…" : s);
  return (
    <figure className={cn("w-full", className)}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} className="h-auto w-full">
        <title>{title}</title>
        {data.map((d, i) => {
          const w = ((W - labelW - valueW) * d.value) / max;
          const y = i * rowH + 4;
          return (
            <g key={d.label + i}>
              <title>{`${d.label}: ${format(d.value)}`}</title>
              <text x={0} y={y + 17} fontSize={12} className="fill-charcoal">{trunc(d.label)}</text>
              <rect x={labelW} y={y + 5} width={Math.max(d.value > 0 ? 2 : 0, w)} height={16} rx={3} className="fill-forest" />
              <text x={labelW + Math.max(2, w) + 6} y={y + 17} fontSize={12} className="fill-muted">{format(d.value)}</text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
