import { cn } from "@/lib/cn";

export interface Point { label: string; value: number }

/** Smooth area line chart (SVG, no dependencies). Renders only the data it is given; the latest value gets a callout. */
export function LineChart({ data, title, className, height = 240, format = (n: number) => String(n) }: { data: Point[]; title: string; className?: string; height?: number; format?: (n: number) => string }) {
  const W = 640, H = height, pl = 44, pr = 16, pt = 28, pb = 30;
  const max = Math.max(1, ...data.map((d) => d.value));
  const niceMax = Math.ceil(max / 4) * 4 || 4;
  const x = (i: number) => pl + (data.length <= 1 ? (W - pl - pr) / 2 : (i * (W - pl - pr)) / (data.length - 1));
  const y = (v: number) => pt + (H - pt - pb) * (1 - v / niceMax);
  const pts = data.map((d, i) => [x(i), y(d.value)] as const);
  // Catmull-Rom -> cubic Bezier for a smooth curve
  const curve = pts.map((p, i) => {
    if (i === 0) return `M${p[0].toFixed(1)},${p[1].toFixed(1)}`;
    const p0 = pts[i - 2] ?? pts[i - 1], p1 = pts[i - 1], p2 = p, p3 = pts[i + 1] ?? p;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    return `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }).join(" ");
  const area = pts.length > 1 ? `${curve} L${pts[pts.length - 1][0]},${H - pb} L${pts[0][0]},${H - pb} Z` : "";
  const ticks = [0, 1, 2, 3, 4].map((t) => (niceMax * t) / 4);
  const last = data.length ? data[data.length - 1] : null;
  const gid = `lg-${title.replace(/\W/g, "").slice(0, 12)}`;
  return (
    <figure className={cn("w-full", className)}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} className="h-auto w-full">
        <title>{title}</title>
        <defs><linearGradient id={gid} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#1D5FD8" stopOpacity="0.18" /><stop offset="1" stopColor="#1D5FD8" stopOpacity="0" /></linearGradient></defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pl} x2={W - pr} y1={y(t)} y2={y(t)} className="stroke-line" strokeWidth={1} strokeDasharray="3 4" />
            <text x={pl - 8} y={y(t) + 4} textAnchor="end" className="fill-muted" fontSize={11}>{format(t)}</text>
          </g>
        ))}
        {pts.length > 1 && <path d={area} fill={`url(#${gid})`} />}
        {pts.length > 1 && <path d={curve} fill="none" stroke="#1D5FD8" strokeWidth={2.5} strokeLinecap="round" />}
        {data.map((d, i) => (
          <g key={d.label + i}>
            <title>{`${d.label}: ${format(d.value)}`}</title>
            <circle cx={x(i)} cy={y(d.value)} r={i === data.length - 1 ? 5 : 3} fill="#fff" stroke="#1D5FD8" strokeWidth={2} />
            <text x={x(i)} y={H - 8} textAnchor="middle" className="fill-muted" fontSize={11}>{d.label}</text>
          </g>
        ))}
        {last && pts.length > 0 && (
          <g transform={`translate(${Math.min(Math.max(pts[pts.length - 1][0], pl + 50), W - pr - 50)},${Math.max(pts[pts.length - 1][1] - 14, 12)})`}>
            <rect x={-46} y={-20} width={92} height={22} rx={7} fill="#1A2233" />
            <text textAnchor="middle" y={-5} fontSize={11} fontWeight={600} fill="#fff">{last.label}: {format(last.value)}</text>
          </g>
        )}
      </svg>
    </figure>
  );
}
