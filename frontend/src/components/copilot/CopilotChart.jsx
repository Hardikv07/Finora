/**
 * CopilotChart — Renders lightweight inline SVG charts from chart config metadata.
 * Supports: pie, bar, line
 */
import React from 'react';

const COLORS = ['#6366f1','#f59e0b','#10b981','#ef4444','#3b82f6','#ec4899','#14b8a6','#f97316','#8b5cf6','#06b6d4'];

// ─── Pie Chart ────────────────────────────────────────────────────────────────
const PieChart = ({ labels, data, colors, title }) => {
  const total = data.reduce((s, v) => s + (v || 0), 0);
  if (total === 0) return null;

  let cumulative = 0;
  const slices = data.map((val, i) => {
    const pct = val / total;
    const startAngle = cumulative * 2 * Math.PI;
    cumulative += pct;
    const endAngle = cumulative * 2 * Math.PI;
    const large = pct > 0.5 ? 1 : 0;
    const cx = 60, cy = 60, r = 55;
    const x1 = cx + r * Math.sin(startAngle);
    const y1 = cy - r * Math.cos(startAngle);
    const x2 = cx + r * Math.sin(endAngle);
    const y2 = cy - r * Math.cos(endAngle);
    return { d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`, color: colors?.[i] || COLORS[i % COLORS.length], label: labels[i], pct: (pct * 100).toFixed(1) };
  });

  return (
    <div className="mt-3">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{title}</p>
      <div className="flex items-start gap-4">
        <svg width="120" height="120" viewBox="0 0 120 120" className="shrink-0">
          {slices.map((s, i) => <path key={i} d={s.d} fill={s.color} stroke="white" strokeWidth="1.5" />)}
        </svg>
        <div className="flex flex-col gap-1 text-xs max-h-28 overflow-y-auto pr-1">
          {slices.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
              <span className="text-slate-300 truncate">{s.label}</span>
              <span className="text-slate-400 shrink-0 ml-auto pl-2">{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Bar Chart ────────────────────────────────────────────────────────────────
const BarChart = ({ labels, data, colors, title, datasets }) => {
  // Support both single data array and multi-dataset (for compare months)
  const allData = datasets ? datasets.flatMap(d => d.data) : data;
  const maxVal = Math.max(...allData.filter(Boolean), 1);
  const barData = datasets
    ? datasets[0].data.map((v, i) => ({
        label: labels[i],
        values: datasets.map(d => ({ val: d.data[i] || 0, color: d.color, label: d.label })),
      }))
    : (data || []).map((v, i) => ({
        label: labels?.[i] || '',
        values: [{ val: v || 0, color: colors?.[0] || COLORS[0], label: '' }],
      }));

  return (
    <div className="mt-3">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{title}</p>
      <div className="flex items-end gap-1.5 h-28 overflow-x-auto pb-4">
        {barData.slice(0, 8).map((item, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5 min-w-[28px] flex-1">
            <div className="flex items-end gap-0.5 h-20 w-full">
              {item.values.map((v, j) => (
                <div
                  key={j}
                  title={`${item.label}: ${v.val.toLocaleString('en-IN')}`}
                  className="rounded-t-sm transition-all flex-1"
                  style={{ height: `${Math.max((v.val / maxVal) * 100, 2)}%`, background: v.color || COLORS[j % COLORS.length] }}
                />
              ))}
            </div>
            <span className="text-[9px] text-slate-500 truncate w-full text-center">{item.label?.slice(0, 6)}</span>
          </div>
        ))}
      </div>
      {datasets && (
        <div className="flex gap-3 flex-wrap mt-1">
          {datasets.map((d, i) => (
            <div key={i} className="flex items-center gap-1 text-[10px] text-slate-400">
              <span className="w-2 h-2 rounded-sm" style={{ background: d.color }} />
              {d.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Line Chart ───────────────────────────────────────────────────────────────
const LineChart = ({ labels, data, colors, title }) => {
  const width = 260, height = 80;
  const maxVal = Math.max(...data.filter(Boolean), 1);
  const minVal = Math.min(...data.filter(v => v !== undefined), 0);
  const range = maxVal - minVal || 1;

  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * (width - 20) + 10,
    y: height - ((v - minVal) / range) * (height - 10) - 5,
  }));

  const pathD = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
  const lineColor = colors?.[0] || COLORS[0];

  return (
    <div className="mt-3">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{title}</p>
      <svg width={width} height={height + 16} className="overflow-visible">
        <defs>
          <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#grad-${title})`} />
        <path d={pathD} stroke={lineColor} strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill={lineColor} stroke="white" strokeWidth="1.5" />
        ))}
        {labels.map((l, i) => (
          <text key={i} x={points[i]?.x || 0} y={height + 14} textAnchor="middle" fontSize="8" fill="#94a3b8">
            {l?.slice(0, 4)}
          </text>
        ))}
      </svg>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const CopilotChart = ({ chart }) => {
  if (!chart || !chart.type) return null;

  if (chart.type === 'pie') return <PieChart {...chart} />;
  if (chart.type === 'bar') return <BarChart {...chart} />;
  if (chart.type === 'line') return <LineChart {...chart} />;
  return null;
};

export default CopilotChart;
