"use client";
import { Suspense, useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import DataTable from "@/components/DataTable";
import { PageHead, Empty, PageSkeleton, Drawer, Tabs, KV, JsonView, AttestBadge, DeviceBadge, SevBadge, CC, COUNTRY, fmtTime, CounterCard, ValidNote } from "@/components/ui";
import { QberGauge } from "@/components/Charts";
import { SearchIcon, DownloadIcon, CheckCircleIcon, XCircleIcon, MinusCircleIcon, ChipIcon } from "@/components/Icons";
import { useData } from "@/lib/store";
import { DEVICE_TYPES, DEVICE_LABEL, ORIGINS } from "@/lib/constants";
import { exportCsv, exportJson, QBOM_COLS } from "@/lib/export";
import { validateDevice } from "@/lib/validate";

const COLS = [
  { key: "device_id", label: "Device", render: (d) => <span className="mono">{d.device_id}</span> },
  { key: "device_type", label: "Type", render: (d) => <DeviceBadge t={d.device_type} /> },
  { key: "model", label: "Model", render: (d) => <b>{d.model ?? "—"}</b> },
  { key: "vendor", label: "Vendor" },
  { key: "vendor_country", label: "Country", render: (d) => <CC cc={d.vendor_country} /> },
  { key: "origin", label: "Origin" },
  { key: "fw", label: "Firmware / SW", render: (d) => d.firmware_version || d.software_version ? `${d.firmware_version ?? "—"} / ${d.software_version ?? "—"}` : "—", sort: (d) => d.firmware_version },
  { key: "communication_protocol", label: "Protocol" },
  { key: "license", label: "License" },
  { key: "att", label: "Attestation", render: (d) => <AttestBadge status={d.attestation?.status} />, sort: (d) => d.attestation?.status },
];

function Metrics({ d }) {
  const m = d.metrics || {};
  return (<div>
    <div className="section-title">Metrics</div>
    {d.device_type === "qkd" && m.qber_percent != null && (<><div className="card-label">QBER</div><QberGauge value={m.qber_percent} /></>)}
    <KV rows={[["Key rate", m.key_rate_bps != null && `${m.key_rate_bps.toLocaleString()} bps`], ["Qubit count", m.qubit_count], ["Measured at", m.measured_at && fmtTime(m.measured_at)]]} />
    {!Object.keys(m).length && <p className="muted">No metrics reported.</p>}
  </div>);
}

function DeviceDrawer({ d, onClose }) {
  const [tab, setTab] = useState("overview");
  const deps = d.dependencies || [], vulns = d.vulnerabilities || [];
  const groups = ["hardware", "firmware", "library", "service"].map((t) => [t, deps.filter((x) => x.type === t)]).filter(([, v]) => v.length);
  const errs = validateDevice(d);
  return (
    <Drawer title={`${d.vendor} ${d.model ?? ""}`} onClose={onClose} badge={<span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><DeviceBadge t={d.device_type} /><AttestBadge status={d.attestation?.status} big /></span>}>
      <Tabs value={tab} onChange={setTab} tabs={[["overview", "Overview"], ["deps", `Dependencies (${deps.length})`], ["vulns", `Vulnerabilities (${vulns.length})`], ["json", "Raw JSON"]]} />
      {tab === "overview" && (<>
        <KV rows={[["Device ID", d.device_id], ["Vendor", <span><CC cc={d.vendor_country} /> {d.vendor} ({COUNTRY[d.vendor_country] || d.vendor_country || "?"})</span>], ["Origin", d.origin], ["Firmware", d.firmware_version], ["Software", d.software_version], ["Protocol", d.communication_protocol], ["License", d.license], ["Attestation", d.attestation?.status || "none"], ["Authority", d.attestation?.authority]]} />
        <Metrics d={d} />
        <div><div className="section-title">Evidence</div><JsonView data={d.evidence || {}} /></div>
      </>)}
      {tab === "deps" && (groups.length === 0 ? <p className="muted">No dependencies recorded.</p> :
        <ul className="tree"><li className="tree-root">{d.model ?? d.device_id}</li>
          <li style={{ display: "block", background: "none", border: 0, padding: 0 }}><ul>{groups.map(([t, v]) => (
            <li key={t} style={{ display: "block" }}><b style={{ textTransform: "capitalize" }}>{t}</b>
              <ul>{v.map((x, i) => <li key={i}><span>{x.name}</span><span className="chip" style={{ marginLeft: "auto" }}>{x.version ?? "?"}</span></li>)}</ul></li>))}</ul></li></ul>)}
      {tab === "vulns" && (vulns.length === 0 ? <div className="notice notice-green">No known vulnerabilities.</div> :
        <div className="table-wrap"><table><thead><tr><th>ID</th><th>Severity</th><th>Description</th></tr></thead><tbody>
          {[...vulns].sort((a, b) => ["CRITICAL", "HIGH", "MEDIUM", "LOW"].indexOf(String(a.severity).toUpperCase()) - ["CRITICAL", "HIGH", "MEDIUM", "LOW"].indexOf(String(b.severity).toUpperCase())).map((v, i) => <tr key={i}><td className="mono">{v.id}</td><td><SevBadge s={v.severity} /></td><td className="wrap">{v.description}</td></tr>)}</tbody></table></div>)}
      {tab === "json" && (<>{errs.length === 0 ? <ValidNote>Valid against qbom-entry.schema.json</ValidNote> : <div className="notice notice-red"><b>Schema errors</b><ul className="errlist">{errs.map((e, i) => <li key={i}><code>{e.path}</code> {e.msg}</li>)}</ul></div>}<JsonView data={d} /></>)}
    </Drawer>
  );
}

function VendorMap({ qbom }) {
  const by = {};
  qbom.forEach((d) => { const c = d.vendor_country || "??"; (by[c] ||= { n: 0, v: new Set() }); by[c].n++; by[c].v.add(d.vendor); });
  const list = Object.entries(by).sort((a, b) => b[1].n - a[1].n);
  return (
    <section className="card"><h2>Vendor country map <span className="h2-sub">supply-chain provenance</span></h2>
      <div className="flag-grid">{list.map(([c, x]) => (
        <div key={c} className={`flag-card ${c.toLowerCase()}`} title={[...x.v].join(", ")}>
          <span className="flag"><CC cc={c === "??" ? null : c} /></span><b>{COUNTRY[c] || (c === "??" ? "Unknown" : c)}</b>
          <span className="muted">{x.n} device{x.n > 1 ? "s" : ""} · {x.v.size} vendor{x.v.size > 1 ? "s" : ""}</span>
        </div>))}</div>
    </section>
  );
}

function Inner() {
  const { qbom, ready } = useData();
  const params = useSearchParams();
  const [q, setQ] = useState("");
  const [fl, setFl] = useState({ type: params.get("type") || "", vendor: "", country: "", origin: "" });
  const [open, setOpen] = useState(null);
  useEffect(() => { setFl((p) => ({ ...p, type: params.get("type") || p.type })); }, [params]);
  const vendors = useMemo(() => [...new Set(qbom.map((d) => d.vendor))].sort(), [qbom]);
  const countries = useMemo(() => [...new Set(qbom.map((d) => d.vendor_country).filter(Boolean))].sort(), [qbom]);
  const rows = useMemo(() => qbom.filter((d) => (!fl.type || d.device_type === fl.type) && (!fl.vendor || d.vendor === fl.vendor) && (!fl.country || d.vendor_country === fl.country) && (!fl.origin || d.origin === fl.origin) &&
    (!q || [d.device_id, d.model, d.vendor, d.communication_protocol].some((v) => String(v ?? "").toLowerCase().includes(q.toLowerCase())))), [qbom, fl, q]);
  const set = (k) => (e) => setFl((p) => ({ ...p, [k]: e.target.value }));

  if (!ready) return <PageSkeleton />;
  const counts = { verified: 0, unverified: 0, none: 0 };
  qbom.forEach((d) => counts[d.attestation?.status || "none"]++);
  const crumbs = [{ label: "Dashboard", href: "/dashboard" }, { label: "QBOM Inventory", href: open ? "/qbom" : undefined }, ...(open ? [{ label: open.device_id }] : [])];
  return (<>
    <PageHead crumbs={crumbs} title="QBOM Inventory" subtitle="Quantum Bill of Materials — QPUs, QKD, QRNGs, PQC hardware, simulators and SDKs." />
    {qbom.length > 0 && <div className="cards">
      <CounterCard label="Devices" value={qbom.length} tone="brand" icon={<ChipIcon />} />
      <CounterCard label="Verified" value={counts.verified} tone="green" icon={<CheckCircleIcon />} sub="attestation verified" />
      <CounterCard label="Unverified" value={counts.unverified} tone="red" icon={<XCircleIcon />} sub="attestation failed" />
      <CounterCard label="No attestation" value={counts.none} tone="grey" icon={<MinusCircleIcon />} sub="not provided" />
    </div>}
    <div className="toolbar">
      <div className="search-wrap"><SearchIcon /><input className="input search" placeholder="Search device, model, vendor…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search devices" /></div>
      <select className="input" value={fl.type} onChange={set("type")} aria-label="Device type"><option value="">All device types</option>{DEVICE_TYPES.map((t) => <option key={t} value={t}>{DEVICE_LABEL[t]}</option>)}</select>
      <select className="input" value={fl.vendor} onChange={set("vendor")} aria-label="Vendor"><option value="">All vendors</option>{vendors.map((v) => <option key={v}>{v}</option>)}</select>
      <select className="input" value={fl.country} onChange={set("country")} aria-label="Vendor country"><option value="">All countries</option>{countries.map((v) => <option key={v} value={v}>{v}</option>)}</select>
      <select className="input" value={fl.origin} onChange={set("origin")} aria-label="Origin"><option value="">All origins</option>{ORIGINS.map((v) => <option key={v}>{v}</option>)}</select>
      <span style={{ flex: 1 }} />
      <button className="btn" disabled={!rows.length} onClick={() => exportCsv("qcbom-qbom.csv", rows, QBOM_COLS)}><DownloadIcon />CSV</button>
      <button className="btn" disabled={!rows.length} onClick={() => exportJson("qcbom-qbom.json", rows, { exported_at: new Date().toISOString() })}><DownloadIcon />JSON</button>
    </div>
    <DataTable columns={COLS} rows={rows} rowId={(d) => d.device_id} selectedId={open?.device_id} onRowClick={setOpen}
      empty={qbom.length ? <Empty title="No devices match">Try clearing a filter.</Empty> : <Empty title="Scan not yet run" action={<Link className="btn btn-primary" href="/ingest">Upload QBOM</Link>}>No <code>qbom-findings.json</code> has been ingested.</Empty>} />
    {qbom.length > 0 && <VendorMap qbom={rows.length ? rows : qbom} />}
    {open && <DeviceDrawer d={open} onClose={() => setOpen(null)} />}
  </>);
}
export default function Page() { return <Suspense fallback={<PageSkeleton />}><Inner /></Suspense>; }
