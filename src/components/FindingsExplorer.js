"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import DataTable from "./DataTable";
import FindingDrawer from "./FindingDrawer";
import { RiskBadge, QBadge, Empty, PageSkeleton, Tabs } from "./ui";
import { SearchIcon, DownloadIcon } from "./Icons";
import { useData } from "@/lib/store";
import { ASSET_TYPES, ORIGINS, MODULES, REF_TYPES } from "@/lib/constants";
import { riskLevel, keySizeBucket, KEY_BUCKETS, assetKey, correlate } from "@/lib/analysis";
import { exportCsv, exportJson, FINDING_COLS } from "@/lib/export";
import Link from "next/link";

const fid = (f) => `${f.module}::${f.finding_id}`;

export const BASE_COLS = [
  { key: "finding_id", label: "Finding ID", render: (f) => <span className="mono">{f.finding_id}</span> },
  { key: "asset_type", label: "Asset type", render: (f) => <span className="chip">{f.asset_type}</span> },
  { key: "algorithm", label: "Algorithm", render: (f) => <b>{f.algorithm}</b> },
  { key: "key_size", label: "Key size", render: (f) => f.key_size ?? "—", sort: (f) => f.key_size },
  { key: "q", label: "Quantum", render: (f) => <QBadge f={f} />, sort: (f) => f.algorithm },
  { key: "risk", label: "Risk", render: (f) => <RiskBadge f={f} />, sort: (f) => ["critical", "high", "medium", "safe"].indexOf(riskLevel(f)) },
  { key: "origin", label: "Origin" },
  { key: "module", label: "Module" },
  { key: "ref", label: "Ref type", render: (f) => f.evidence?.reference_type, sort: (f) => f.evidence?.reference_type },
  { key: "value", label: "Evidence", render: (f) => <span className="mono">{String(f.evidence?.value ?? "")}</span>, sort: (f) => String(f.evidence?.value ?? "") },
];

/** Generic explorer: used for the global CBOM page and each module view (module prop fixes the scope). */
export default function FindingsExplorer({ module, columns, onOpenChange, exportName = "findings", showCorrelation }) {
  const { findings, ready } = useData();
  const params = useSearchParams();
  const [q, setQ] = useState("");
  const [fl, setFl] = useState({ asset_type: "", origin: "", module: "", ref: "", key: "", risk: params.get("risk") || "" });
  const [open, setOpen] = useState(null);
  const [view, setView] = useState("table");

  const scope = useMemo(() => (module ? findings.filter((f) => f.module === module) : findings), [findings, module]);
  useEffect(() => {
    const o = params.get("open");
    if (o && findings.length) { const f = findings.find((x) => fid(x) === o); if (f) setOpen(f); }
  }, [params, findings]);
  useEffect(() => { onOpenChange?.(open); }, [open]); // eslint-disable-line

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return scope.filter((f) =>
      (!fl.asset_type || f.asset_type === fl.asset_type) && (!fl.origin || f.origin === fl.origin) && (!fl.module || f.module === fl.module) &&
      (!fl.ref || f.evidence?.reference_type === fl.ref) && (!fl.key || keySizeBucket(f) === fl.key) && (!fl.risk || riskLevel(f) === fl.risk) &&
      (!s || [f.algorithm, f.evidence?.value, f.finding_id, f.fingerprint].some((v) => String(v ?? "").toLowerCase().includes(s))));
  }, [scope, q, fl]);

  const groups = useMemo(() => correlate(rows), [rows]);
  const set = (k) => (e) => setFl((p) => ({ ...p, [k]: e.target.value }));
  const active = Object.values(fl).some(Boolean) || q;

  if (!ready) return <PageSkeleton />;
  const cols = columns || BASE_COLS.filter((c) => !module || c.key !== "module");
  const related = open && assetKey(open) ? findings.filter((f) => assetKey(f) === assetKey(open)) : [];

  const emptyEl = scope.length === 0
    ? <Empty title={module ? "Scan not yet run" : "No findings"} action={<Link className="btn btn-primary" href="/ingest">Upload findings</Link>}>{module ? `No findings from ${module} have been ingested yet.` : "Upload a *-findings.json file to get started."}</Empty>
    : <Empty title="No findings match">Try clearing a filter.</Empty>;

  return (<>
    <div className="toolbar">
      <div className="search-wrap"><SearchIcon /><input className="input search" placeholder="Search algorithm, evidence, ID, fingerprint…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search findings" /></div>
      <select className="input" value={fl.asset_type} onChange={set("asset_type")} aria-label="Asset type"><option value="">All asset types</option>{ASSET_TYPES.map((x) => <option key={x}>{x}</option>)}</select>
      <select className="input" value={fl.key} onChange={set("key")} aria-label="Key size"><option value="">Any key size</option>{KEY_BUCKETS.map((x) => <option key={x} value={x}>{x === "none" ? "No key size" : x + " bits"}</option>)}</select>
      <select className="input" value={fl.origin} onChange={set("origin")} aria-label="Origin"><option value="">All origins</option>{ORIGINS.map((x) => <option key={x}>{x}</option>)}</select>
      {!module && <select className="input" value={fl.module} onChange={set("module")} aria-label="Module"><option value="">All modules</option>{Object.keys(MODULES).map((x) => <option key={x}>{x}</option>)}</select>}
      <select className="input" value={fl.ref} onChange={set("ref")} aria-label="Evidence reference type"><option value="">All ref types</option>{REF_TYPES.map((x) => <option key={x}>{x}</option>)}</select>
      <select className="input" value={fl.risk} onChange={set("risk")} aria-label="Risk"><option value="">All risk</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="safe">Safe</option></select>
      {active && <button className="btn" onClick={() => { setQ(""); setFl({ asset_type: "", origin: "", module: "", ref: "", key: "", risk: "" }); }}>Clear</button>}
      <span style={{ flex: 1 }} />
      <button className="btn" disabled={!rows.length} onClick={() => exportCsv(`${exportName}.csv`, rows, FINDING_COLS)}><DownloadIcon />CSV</button>
      <button className="btn" disabled={!rows.length} onClick={() => exportJson(`${exportName}.json`, rows, { exported_at: new Date().toISOString() })}><DownloadIcon />JSON</button>
    </div>
    {showCorrelation && <Tabs value={view} onChange={setView} tabs={[["table", `Findings (${rows.length})`], ["corr", `Correlation view (${groups.length})`]]} />}
    {view === "table" || !showCorrelation
      ? <DataTable columns={cols} rows={rows} rowId={fid} selectedId={open && fid(open)} onRowClick={setOpen} empty={emptyEl} />
      : groups.length === 0 ? <div className="table-wrap"><Empty title="No correlated assets">No findings carry an <code>asset_key</code> from the correlation store.</Empty></div>
      : <div style={{ display: "grid", gap: 12 }}>{groups.map((g) => (
          <details key={g.key} className="group-card">
            <summary><b className="mono">{g.key}</b><span className="badge badge-blue">{g.items.length} findings</span><span className="badge badge-grey">{g.modules.length} scanner{g.modules.length > 1 ? "s" : ""}</span>{g.modules.map((m) => <span key={m} className="chip">{m}</span>)}</summary>
            <DataTable columns={cols} rows={g.items} rowId={fid} onRowClick={setOpen} pageSize={50} />
          </details>))}</div>}
    {open && <FindingDrawer f={open} related={related} onClose={() => setOpen(null)} onOpen={setOpen} />}
  </>);
}
