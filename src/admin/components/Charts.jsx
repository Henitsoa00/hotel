import { useState } from "react";
import { formatPrice } from "../../utils/booking";

const compact = (n) => n >= 1000 ? `${Math.round(n / 1000)}k` : Math.round(n);

export function AreaChart({ data, color = "#b8975a", format = compact, height = 220 }) {
  const [hover, setHover] = useState(null);
  const W = 700, H = height, L = 45, R = 12, T = 18, B = 34;
  const max = Math.max(...data.map((d) => d.value), 1) * 1.16;
  const x = (i) => L + i * (W - L - R) / Math.max(1, data.length - 1);
  const y = (v) => H - B - (v / max) * (H - T - B);
  const points = data.map((d, i) => `${x(i)},${y(d.value)}`).join(" ");
  const line = data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.value)}`).join(" ");
  const area = `${line} L ${x(data.length - 1)} ${H - B} L ${x(0)} ${H - B} Z`;
  const labels = data.length <= 7 ? data.map((_, i) => i) : [0, Math.floor((data.length - 1) / 4), Math.floor((data.length - 1) / 2), Math.floor((data.length - 1) * .75), data.length - 1];
  return <div className="w-full"><svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" role="img" aria-label="Graphique d'évolution">
    <defs><linearGradient id={`fill-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".2"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
    {[0, .25, .5, .75, 1].map((t) => <g key={t}><line x1={L} x2={W - R} y1={y(max * t)} y2={y(max * t)} stroke="#e9e8e5" strokeDasharray="3 5"/><text x={L - 10} y={y(max * t) + 4} textAnchor="end" fill="#a2a5a9" fontSize="10">{format(max * t)}</text></g>)}
    <path d={area} fill={`url(#fill-${color.replace("#", "")})`} />
    <path d={line} fill="none" stroke={color} strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" className="chart-draw" />
    {labels.map((i) => <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"} fill="#a2a5a9" fontSize="10">{data[i]?.label}</text>)}
    {data.map((d, i) => <circle key={i} cx={x(i)} cy={y(d.value)} r="12" fill="transparent" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}><title>{d.label}: {format(d.value)}</title></circle>)}
    {hover !== null && <g pointerEvents="none"><line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} stroke={color} opacity=".35" strokeDasharray="4 4"/><circle cx={x(hover)} cy={y(data[hover].value)} r="5" fill="white" stroke={color} strokeWidth="2.5"/><rect x={Math.min(W - 120, Math.max(5, x(hover) - 52))} y={Math.max(0, y(data[hover].value) - 39)} rx="7" width="104" height="27" fill="#0f1b2d"/><text x={Math.min(W - 68, Math.max(57, x(hover)))} y={Math.max(0, y(data[hover].value) - 39) + 18} textAnchor="middle" fill="white" fontSize="11">{format(data[hover].value)}</text></g>}
  </svg></div>;
}

export function BarChart({ data, color = "#b8975a", format = compact, height = 205 }) {
  const W = 700, H = height, L = 42, R = 10, T = 10, B = 31;
  const max = Math.max(...data.map((d) => d.value), 1) * 1.13;
  const slot = (W - L - R) / Math.max(1, data.length);
  const bar = Math.min(33, slot * .6);
  const y = (v) => H - B - v / max * (H - T - B);
  return <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Graphique en barres">
    {[0, .5, 1].map((t) => <g key={t}><line x1={L} x2={W-R} y1={y(max*t)} y2={y(max*t)} stroke="#e9e8e5" strokeDasharray="3 5"/><text x={L-8} y={y(max*t)+4} textAnchor="end" fill="#a2a5a9" fontSize="10">{format(max*t)}</text></g>)}
    {data.map((d, i) => <g key={`${d.date}-${i}`}>
      <rect x={L + slot*i + (slot-bar)/2} y={y(d.value)} width={bar} height={Math.max(1, H-B-y(d.value))} rx="4" fill={color} opacity={i === data.length - 1 ? 1 : .65} className="transition-all duration-300 hover:opacity-100"><title>{d.label}: {format(d.value)}</title></rect>
      {(data.length <= 12 || i % Math.ceil(data.length / 12) === 0) && <text x={L + slot*(i+.5)} y={H-7} textAnchor="middle" fill="#a2a5a9" fontSize="10">{d.label}</text>}
    </g>)}
  </svg>;
}

export function DonutChart({ data, centerLabel, centerValue, money = false, size = 174 }) {
  const colors = ["#b8975a", "#1c3048", "#9db4aa", "#d8cab0", "#a6adba", "#705f4a"];
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let acc = 0;
  const gradient = data.map((d, i) => { const start = acc; acc += d.value / total * 100; return `${colors[i % colors.length]} ${start}% ${acc}%`; }).join(", ");
  return <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-9">
    <div className="relative shrink-0 rounded-full transition-transform duration-700 hover:rotate-6" style={{ width: size, height: size, background: `conic-gradient(${gradient || "#eee6d8 0% 100%"})` }} role="img" aria-label="Répartition">
      <div className="absolute inset-[19%] flex flex-col items-center justify-center rounded-full bg-white text-center">
        <span className="font-serif text-[30px] leading-none">{centerValue ?? (money ? formatPrice(total) : total)}</span>
        <span className="mt-1 max-w-[85px] text-[10px] leading-tight text-night/45">{centerLabel}</span>
      </div>
    </div>
    <div className="min-w-0 flex-1 space-y-2.5">
      {data.map((d, i) => <div key={d.label} className="flex items-center justify-between gap-4 text-[11px]"><span className="flex min-w-0 items-center gap-2 text-night/60"><span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: colors[i % colors.length] }}/><span className="truncate">{d.label}</span></span><strong className="whitespace-nowrap font-medium text-night">{money ? formatPrice(d.value) : `${Math.round(d.value / total * 100)} %`}</strong></div>)}
    </div>
  </div>;
}