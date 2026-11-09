import { cn } from "@/lib/cn";

export interface Point { label: string; value: number }

/** Small dependency-free SVG line chart. Renders only the data it is given; pass an empty array and nothing is drawn. */
export function LineChart({ data, title, className, height = 220, format = (n: number) => String(n) }: { data: Point[]; title: string; className?: string; height?: number; format?: (n: number) => string }) {
  const W = 600, H = height, pl = 36, pr = 12, pt = 12, pb = 28;
  const max = Math.max(1, ...data.map((d) => d.value));
  const niceMax = Math.ceil(max / 4) * 4 || 4;
  const x = (i: number) => pl + (data.length <= 1 ? (W - pl - pr) / 2 : (i * (W - pl - pr)) / (data.length - 1));
  const y = (v: number) => pt + (H - pt - pb) * (1 - v / niceMax);
  const path = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
  const ticks = [0, 1, 2, 3, 4].map((t) => (niceMax * t) / 4);
  return (
    <figure className={cn("w-full", className)}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} className="h-auto w-full">
        <title>{title}</title>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pl} x2={W - pr} y1={y(t)} y2={y(t)} className="stroke-line" strokeWidth={1} />
            <text x={pl - 6} y={y(t) + 4} textAnchor="end" className="fill-muted" fontSize={11}>{format(t)}</text>
          </g>
        ))}
        {data.length > 1 && <path d={path} fill="none" className="stroke-forest" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
        {data.map((d, i) => (
          <g key={d.label + i}>
            <circle cx={x(i)} cy={y(d.value)} r={3.5} className="fill-forest" />
            <title>{`${d.label}: ${format(d.value)}`}</title>
            <text x={x(i)} y={H - 8} textAnchor="middle" className="fill-muted" fontSize={11}>{d.label}</text>
          </g>
        ))}
      </svg>
    </figure>
  );
}
