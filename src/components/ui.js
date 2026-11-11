"use client";
import Link from "next/link";
import { useEffect } from "react";
import { QCLASS, riskLevel, quantumClass } from "@/lib/analysis";
import { RISK_LABEL, DEVICE_LABEL } from "@/lib/constants";
import { XIcon, CheckCircleIcon, XCircleIcon, MinusCircleIcon, AlertsIcon, ShieldAlertIcon, CheckIcon } from "./Icons";

export function CounterCard({ label, value, sub, tone = "grey", icon, onClick, active, small }) {
  const cls = `card counter tone-${tone}`;
  const inner = (<>
    <div className="card-top"><span className="card-label">{label}</span>{icon && <span className="card-icon">{icon}</span>}</div>
    <div className={`card-value${small ? " small" : ""}`}>{value}</div>
    {sub && <div className="card-sub">{sub}</div>}
  </>);
  return onClick ? <button type="button" className={cls} aria-pressed={!!active} onClick={onClick}>{inner}</button> : <div className={cls}>{inner}</div>;
}

export function Crumbs({ items }) {
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      {items.map((it, i) => (
        <span key={i} style={{ display: "contents" }}>
          {i > 0 && <span aria-hidden="true">›</span>}
          {it.href ? <Link href={it.href}>{it.label}</Link> : <span aria-current="page">{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function PageHead({ crumbs, title, subtitle, actions }) {
  return (
    <div className="page-head">
      <div>
        {crumbs && <Crumbs items={crumbs} />}
        <h1>{title}</h1>
        {subtitle && <p className="muted" style={{ marginTop: 4 }}>{subtitle}</p>}
      </div>
      {actions && <div className="toolbar">{actions}</div>}
    </div>
  );
}

export function Empty({ title, children, action }) {
  return <div className="empty"><h3>{title}</h3><p>{children}</p>{action}</div>;
}

export function PageSkeleton() {
  return (
    <div className="sk-stack" aria-busy="true" aria-label="Loading">
      <div className="skeleton" style={{ width: 220, height: 28 }} />
      <div className="cards">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="skeleton block" />)}</div>
      <div className="grid-2"><div className="skeleton block" style={{ height: 220 }} /><div className="skeleton block" style={{ height: 220 }} /></div>
    </div>
  );
}

export function RiskBadge({ f }) {
  const r = riskLevel(f);
  const cls = { critical: "badge-red", high: "badge-orange", medium: "badge-amber", safe: "badge-green" }[r];
  const icon = { critical: <ShieldAlertIcon />, high: <AlertsIcon />, medium: <AlertsIcon />, safe: <CheckCircleIcon /> }[r];
  return <span className={`badge ${cls}`}>{icon}{RISK_LABEL[r]}</span>;
}
export function QBadge({ f }) {
  const q = QCLASS[quantumClass(f)];
  const icon = { broken: <XCircleIcon />, weakened: <AlertsIcon />, safe: <CheckCircleIcon />, unknown: <MinusCircleIcon /> }[quantumClass(f)];
  return <span className={`badge ${q.cls}`}>{icon}{q.label}</span>;
}
export function SevBadge({ s }) {
  const v = String(s).toUpperCase();
  const cls = { CRITICAL: "badge-red", HIGH: "badge-orange", MEDIUM: "badge-amber", LOW: "badge-blue" }[v] || "badge-grey";
  return <span className={`badge ${cls}`}>{v}</span>;
}
export function AttestBadge({ status, big }) {
  const s = status || "none";
  const m = { verified: ["badge-green", <CheckCircleIcon key="v" />, "Verified"], unverified: ["badge-red", <XCircleIcon key="u" />, "Unverified"], none: ["badge-grey", <MinusCircleIcon key="n" />, "No attestation"] }[s];
  return <span className={`badge ${m[0]}`} style={big ? { fontSize: 14, padding: "4px 14px" } : undefined}>{m[1]}{m[2]}</span>;
}
export const DeviceBadge = ({ t }) => <span className="badge badge-blue">{DEVICE_LABEL[t] || t}</span>;

export function Drawer({ title, badge, onClose, children }) {
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (<>
    <div className="scrim" onClick={onClose} />
    <aside className="drawer" role="dialog" aria-modal="true" aria-label={title}>
      <div className="drawer-head">
        <div style={{ display: "grid", gap: 6 }}><h2>{title}</h2>{badge}</div>
        <button className="icon-btn" onClick={onClose} aria-label="Close"><XIcon /></button>
      </div>
      <div className="drawer-body">{children}</div>
    </aside>
  </>);
}

export function Tabs({ tabs, value, onChange }) {
  return <div className="tabs" role="tablist">{tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={value === k} className="tab" onClick={() => onChange(k)}>{l}</button>)}</div>;
}

export function JsonView({ data }) {
  const html = JSON.stringify(data, null, 2)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, (m) =>
      `<span class="${/^"/.test(m) ? (/:$/.test(m) ? "k" : "s") : /true|false|null/.test(m) ? "b" : "n"}">${m}</span>`);
  return <pre className="json mono" dangerouslySetInnerHTML={{ __html: html }} />;
}

export function KV({ rows }) {
  return <dl className="kv">{rows.filter((r) => r[1] != null && r[1] !== "").map(([k, v]) => [<dt key={k + "t"}>{k}</dt>, <dd key={k + "d"}>{v}</dd>])}</dl>;
}

export const fmtTime = (iso) => { if (!iso) return "—"; const d = new Date(iso); return isNaN(d) ? String(iso) : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }); };
/** ISO 3166-1 alpha-2 code shown as a small tag (flag emoji are not used: they do not render on Windows). */
export const CC = ({ cc }) => <span className="cc">{cc && /^[A-Z]{2}$/.test(cc) ? cc : "—"}</span>;
export const ValidNote = ({ children }) => <div className="notice notice-green" style={{ display: "flex", gap: 8, alignItems: "center" }}><span className="inline-icon"><CheckIcon /></span>{children}</div>;
export const COUNTRY = { US: "United States", CN: "China", CH: "Switzerland", FR: "France", DE: "Germany", ES: "Spain", CA: "Canada", JP: "Japan", GB: "United Kingdom", IN: "India", RU: "Russia", KR: "South Korea", NL: "Netherlands", AU: "Australia", IL: "Israel", FI: "Finland", SE: "Sweden", SG: "Singapore", CZ: "Czechia", AT: "Austria" };
