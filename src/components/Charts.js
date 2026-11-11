"use client";

export function Donut({ data, label }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const R = 52, C = 2 * Math.PI * R;
  let off = 0;
  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 140 140" role="img" aria-label={label}>
        <circle cx="70" cy="70" r={R} fill="none" stroke="var(--surface-3)" strokeWidth="18" />
        {total > 0 && data.filter((d) => d.value > 0).map((d) => {
          const len = (d.value / total) * C;
          const el = <circle key={d.label} cx="70" cy="70" r={R} fill="none" stroke={d.color} strokeWidth="18" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-off} transform="rotate(-90 70 70)"><title>{d.label}: {d.value}</title></circle>;
          off += len; return el;
        })}
        <text x="70" y="68" textAnchor="middle" style={{ fill: "var(--text)", fontSize: 22, fontWeight: 700 }}>{total}</text>
        <text x="70" y="84" textAnchor="middle" style={{ fill: "var(--text-dim)", fontSize: 9, letterSpacing: ".08em" }}>TOTAL</text>
      </svg>
      <ul className="legend">{data.map((d) => <li key={d.label}><i style={{ background: d.color }} />{d.label}<b>{d.value}</b></li>)}</ul>
    </div>
  );
}

export function HBars({ data }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="hbars">
      {data.map((d) => (
        <div className="hbar-row" key={d.label}>
          <span title={d.title}>{d.label}</span>
          <div className="hbar-track"><div className="hbar-fill" style={{ width: `${(d.value / max) * 100}%`, background: d.color || "var(--brand-text)" }} /></div>
          <b>{d.value}</b>
        </div>
      ))}
    </div>
  );
}

/** rows × cols grid, cell tinted by value / max in the column colour. */
export function Heatmap({ rows, cols, get, onCell }) {
  const vals = rows.flatMap((r) => cols.map((c) => get(r, c)));
  const max = Math.max(1, ...vals);
  return (
    <div className="heat" style={{ gridTemplateColumns: `110px repeat(${cols.length}, 1fr)` }}>
      <span />
      {cols.map((c) => <span key={c.key} className="heat-h">{c.label}</span>)}
      {rows.map((r) => [
        <span key={r.key + "l"} className="heat-r">{r.label}</span>,
        ...cols.map((c) => {
          const v = get(r, c);
          const a = v ? 0.12 + 0.6 * (v / max) : 0;
          return (
            <div key={r.key + c.key} className="heat-cell" title={`${r.label} · ${c.label}: ${v}`}
              style={{ background: v ? `color-mix(in srgb, ${c.color} ${Math.round(a * 100)}%, transparent)` : "var(--surface-2)", color: v ? "var(--text)" : "var(--text-dim)", cursor: onCell && v ? "pointer" : "default" }}
              onClick={() => onCell && v && onCell(r, c)}>{v || "·"}</div>
          );
        }),
      ])}
    </div>
  );
}

export function LineChart({ points, series, height = 170 }) {
  const W = 560, H = height, P = { l: 30, r: 10, t: 10, b: 22 };
  const max = Math.max(1, ...points.flatMap((p) => series.map((s) => p[s.key] || 0)));
  const x = (i) => P.l + (points.length < 2 ? (W - P.l - P.r) / 2 : (i * (W - P.l - P.r)) / (points.length - 1));
  const y = (v) => P.t + (1 - v / max) * (H - P.t - P.b);
  return (
    <>
      <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Trend over time">
        {[0, 0.5, 1].map((t) => <g key={t}><line className="grid" x1={P.l} x2={W - P.r} y1={y(max * t)} y2={y(max * t)} /><text x={P.l - 6} y={y(max * t) + 3} textAnchor="end">{Math.round(max * t)}</text></g>)}
        {series.map((s) => (
          <g key={s.key}>
            <polyline fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" points={points.map((p, i) => `${x(i)},${y(p[s.key] || 0)}`).join(" ")} />
            {points.map((p, i) => <circle key={i} cx={x(i)} cy={y(p[s.key] || 0)} r="3" fill={s.color}><title>{p.at} · {s.label}: {p[s.key]}</title></circle>)}
          </g>
        ))}
        {points.map((p, i) => (i === 0 || i === points.length - 1 || points.length < 7) && <text key={i} x={x(i)} y={H - 6} textAnchor="middle">{String(p.at).slice(5)}</text>)}
      </svg>
      <ul className="legend" style={{ display: "flex", gap: 16, marginTop: 8 }}>{series.map((s) => <li key={s.key}><i style={{ background: s.color }} />{s.label}</li>)}</ul>
    </>
  );
}

/** QBER gauge on a 0–15% scale with the 5% and 11% thresholds. */
export function QberGauge({ value }) {
  const MAX = 15, pct = (v) => `${(Math.min(v, MAX) / MAX) * 100}%`;
  const tone = value > 11 ? "Above abort threshold (11%) — key unusable" : value > 5 ? "Elevated (5–11%) — investigate" : "Healthy (< 5%)";
  return (
    <div>
      <div className="gauge" role="meter" aria-valuemin={0} aria-valuemax={MAX} aria-valuenow={value} aria-label="QBER" title={tone}>
        <span className="gauge-mark" style={{ left: pct(value) }} />
        <span className="gauge-tick" style={{ left: pct(5) }}>5%</span>
        <span className="gauge-tick" style={{ left: pct(11) }}>11%</span>
      </div>
      <p className="card-sub"><b style={{ color: "var(--text)" }}>{value}%</b> · {tone}</p>
    </div>
  );
}
