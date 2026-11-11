"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { XCircleIcon, AlertsIcon, CheckCircleIcon, LockIcon, ListIcon, CheckIcon, XIcon } from "@/components/Icons";
import { useData } from "@/lib/store";
import { PageHead, CounterCard, PageSkeleton, Empty, Tabs, QBadge, RiskBadge } from "@/components/ui";
import DataTable from "@/components/DataTable";
import FindingDrawer from "@/components/FindingDrawer";
import { Donut } from "@/components/Charts";
import { quantumClass, weakReason, certInChecklist, migrationList, count } from "@/lib/analysis";
import { MODULES } from "@/lib/constants";

export default function Page() {
  const { findings, qbom, ready } = useData();
  const [tab, setTab] = useState("quantum");
  const [open, setOpen] = useState(null);
  if (!ready) return <PageSkeleton />;
  const crumbs = [{ label: "Dashboard", href: "/dashboard" }, { label: "Risk & Compliance" }];
  if (!findings.length) return (<><PageHead crumbs={crumbs} title="Risk & Compliance" /><div className="card"><Empty title="No findings to analyse" action={<Link className="btn btn-primary" href="/ingest">Upload findings</Link>}>Risk analysis needs CBOM findings.</Empty></div></>);

  const qc = count(findings, quantumClass);
  const weak = findings.filter(weakReason);
  const checklist = certInChecklist(findings, qbom);
  const passed = checklist.filter((c) => c.ok).length;
  const mig = migrationList(findings);
  const algSummary = Object.entries(findings.reduce((a, f) => { const k = f.algorithm; (a[k] ||= { alg: k, n: 0, q: quantumClass(f) }).n++; return a; }, {})).map(([, v]) => v).sort((a, b) => b.n - a.n);
  const sortRank = { broken: 0, weakened: 1, unknown: 2, safe: 3 };
  const bySeverity = [...findings].sort((a, b) => sortRank[quantumClass(a)] - sortRank[quantumClass(b)]);

  return (<>
    <PageHead crumbs={crumbs} title="Risk & Compliance" subtitle="Quantum risk classification, weak-crypto alerts, readiness checklist and migration plan." />
    <div className="cards">
      <CounterCard label="Quantum-broken" value={qc.broken || 0} tone="red" icon={<XCircleIcon />} />
      <CounterCard label="Weakened" value={(qc.weakened || 0) + (qc.unknown || 0)} tone="amber" icon={<AlertsIcon />} />
      <CounterCard label="Quantum-safe" value={qc.safe || 0} tone="green" icon={<CheckCircleIcon />} />
      <CounterCard label="Weak crypto alerts" value={weak.length} tone="orange" icon={<LockIcon />} />
      <CounterCard label="Checklist" value={`${passed}/${checklist.length}`} tone="blue" sub="controls met" icon={<ListIcon />} />
    </div>
    <Tabs value={tab} onChange={setTab} tabs={[["quantum", "Quantum risk"], ["weak", `Weak crypto (${weak.length})`], ["certin", "CERT-In checklist"], ["migration", `Migration priority (${mig.length})`]]} />

    {tab === "quantum" && (<div className="grid-2">
      <section className="card"><h2>Classification</h2><Donut label="Quantum classification" data={[{ label: "Quantum-Broken", value: qc.broken || 0, color: "var(--red)" }, { label: "Weakened", value: (qc.weakened || 0) + (qc.unknown || 0), color: "var(--amber)" }, { label: "Quantum-Safe", value: qc.safe || 0, color: "var(--green)" }]} />
        <div className="notice notice-blue" style={{ marginTop: 16 }}><b>Broken:</b> RSA, ECDSA, DH, DSA (Shor). <b>Weakened:</b> AES-128, SHA-1 (Grover / legacy). <b>Safe:</b> AES-256, SHA-256, ML-KEM, ML-DSA, XMSS.</div></section>
      <section className="card"><h2>By algorithm</h2>
        <DataTable columns={[{ key: "alg", label: "Algorithm", render: (r) => <b>{r.alg}</b> }, { key: "q", label: "Class", render: (r) => <QBadge f={{ algorithm: r.alg }} />, sort: (r) => sortRank[r.q] }, { key: "n", label: "Findings" }]} rows={algSummary} rowId={(r) => r.alg} pageSize={8} />
      </section>
    </div>)}

    {tab === "weak" && (weak.length === 0 ? <div className="card"><Empty title="No weak crypto found">No DES, 3DES, MD5, SHA-1, RSA &lt; 2048 or TLS 1.0/1.1.</Empty></div> :
      <DataTable rows={weak} rowId={(f) => f.module + f.finding_id} onRowClick={setOpen} columns={[
        { key: "risk", label: "Risk", render: (f) => <RiskBadge f={f} /> },
        { key: "alg", label: "Algorithm", render: (f) => <b>{f.algorithm}{f.key_size ? `-${f.key_size}` : ""}</b>, sort: (f) => f.algorithm },
        { key: "why", label: "Reason", render: (f) => weakReason(f), wrap: true },
        { key: "mod", label: "Module", render: (f) => MODULES[f.module]?.label, sort: (f) => f.module },
        { key: "ev", label: "Location", render: (f) => <span className="mono">{String(f.evidence?.value)}</span> }]} />)}

    {tab === "certin" && (
      <section className="card"><h2>CERT-In quantum-readiness checklist <span className="h2-sub">indicative mapping — verify against the current CERT-In guideline</span></h2>
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 8 }}><div className="progress" style={{ flex: 1 }}><i style={{ width: `${(passed / checklist.length) * 100}%` }} /></div><b>{Math.round((passed / checklist.length) * 100)}% coverage</b></div>
        <ul className="checklist">{checklist.map((c) => (
          <li key={c.id}><span className={`tick ${c.ok ? "ok" : "no"}`} aria-hidden="true">{c.ok ? <CheckIcon /> : <XIcon />}</span>
            <div><b>{c.title}</b><div className="card-sub">{c.detail}</div></div>
            <span className={`badge ${c.ok ? "badge-green" : "badge-red"}`}>{c.ok ? "Met" : "Gap"}</span></li>))}</ul></section>)}

    {tab === "migration" && (<DataTable rows={mig} rowId={(r) => r.asset} columns={[
      { key: "rank", label: "#", render: (r) => <span className="rank">{mig.indexOf(r) + 1}</span>, sort: (r) => mig.indexOf(r) },
      { key: "asset", label: "Asset", render: (r) => <span className="mono">{r.asset}</span> },
      { key: "alg", label: "Algorithms", render: (r) => r.algorithms.join(", "), wrap: true },
      { key: "flags", label: "Flags", render: (r) => <span style={{ display: "flex", gap: 4 }}>{r.vuln && <span className="badge badge-red">Quantum-vulnerable</span>}{r.weak && <span className="badge badge-orange">Weak</span>}{r.net && <span className="badge badge-amber">Internet-facing</span>}</span> },
      { key: "mods", label: "Modules", render: (r) => r.modules.map((m) => MODULES[m]?.label).join(", ") },
      { key: "action", label: "Recommended action", render: (r) => r.action, wrap: true },
      { key: "score", label: "Score" }]}
      empty={<Empty title="Nothing to migrate">All assets are quantum-safe.</Empty>} />)}
    {open && <FindingDrawer f={open} onClose={() => setOpen(null)} />}
  </>);
}
