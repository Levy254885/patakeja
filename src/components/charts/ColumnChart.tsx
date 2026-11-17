import { cn } from "@/lib/cn";

export interface Column { label: string; value: number; value2?: number }

/** Vertical rounded-top columns (optionally two series, e.g. income vs expenses). */
export function ColumnChart({ data, title, className, height = 220, format = (n: number) => String(n), colors = ["#1D5FD8", "#F2A33A"] }: { data: Column[]; title: string; className?: string; height?: number; format?: (n: number) => string; colors?: [string, string] | string[] }) {
  const W = 640, H = height, pl = 44, pr = 8, pt = 12, pb = 28;
  const two = data.some((d) => d.value2 != null);
  const max = Math.max(1, ...data.flatMap((d) => [d.value, d.value2 ?? 0]));
  const niceMax = Math.ceil(max / 4) * 4 || 4;
  const slot = (W - pl - pr) / Math.max(1, data.length);
  const bw = Math.min(26, (slot * 0.6) / (two ? 2 : 1));
  const y = (v: number) => pt + (H - pt - pb) * (1 - v / niceMax);
  const bar = (cx: number, v: number, fill: string, label: string) => {
    const h = Math.max(v > 0 ? 3 : 0, H - pb - y(v));
    return <g><title>{`${label}: ${format(v)}`}</title><path d={`M${cx - bw / 2},${H - pb} v${-(h - 6)} a6,6 0 0 1 6,-6 h${bw - 12} a6,6 0 0 1 6,6 v${h - 6} z`} fill={fill} /></g>;
  };
  return (
    <figure className={cn("w-full", className)}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} className="h-auto w-full">
        <title>{title}</title>
        {[0, 1, 2, 3, 4].map((t) => { const v = (niceMax * t) / 4; return (
          <g key={t}><line x1={pl} x2={W - pr} y1={y(v)} y2={y(v)} className="stroke-line" strokeDasharray="3 4" /><text x={pl - 8} y={y(v) + 4} textAnchor="end" className="fill-muted" fontSize={11}>{format(v)}</text></g>
        ); })}
        {data.map((d, i) => {
          const cx = pl + slot * i + slot / 2;
          return (
            <g key={d.label + i}>
              {two ? <>{bar(cx - bw / 2 - 1, d.value, colors[0], d.label)}{bar(cx + bw / 2 + 1, d.value2 ?? 0, colors[1], d.label)}</> : bar(cx, d.value, colors[0], d.label)}
              <text x={cx} y={H - 8} textAnchor="middle" className="fill-muted" fontSize={11}>{d.label}</text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
