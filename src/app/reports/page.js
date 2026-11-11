"use client";
import { useData } from "@/lib/store";
import { PageHead, CounterCard, PageSkeleton, fmtTime, Empty } from "@/components/ui";
import { Donut, HBars } from "@/components/Charts";
import { DownloadIcon, PrintIcon } from "@/components/Icons";
import { summarise, certInChecklist, migrationList, quantumClass, count, weakReason } from "@/lib/analysis";
import { exportCsv, exportJson, FINDING_COLS, QBOM_COLS } from "@/lib/export";
import { RISK_LEVELS, RISK_LABEL, RISK_COLOR, MODULES } from "@/lib/constants";

export default function Page() {
  const { findings, qbom, meta, ready } = useData();
  if (!ready) return <PageSkeleton />;
  const crumbs = [{ label: "Dashboard", href: "/dashboard" }, { label: "Reports" }];
  const s = summarise(findings, qbom);
  const qc = count(findings, quantumClass);
  const mig = migrationList(findings).slice(0, 5);
  const cl = certInChecklist(findings, qbom);
  const stamp = new Date().toISOString().slice(0, 10);
  const recs = [
    s.critical && `Remediate ${s.critical} critical finding(s) first — deprecated primitives (${[...new Set(findings.filter(weakReason).map((f) => f.algorithm))].slice(0, 4).join(", ")}).`,
    qc.broken && `Plan migration of ${qc.broken} quantum-vulnerable asset(s) to ML-KEM / ML-DSA, starting with internet-facing endpoints (hybrid mode recommended).`,
    qbom.some((d) => (d.attestation?.status || "none") !== "verified") && `Obtain attestation for ${qbom.filter((d) => (d.attestation?.status || "none") !== "verified").length} quantum device(s) lacking verified attestation.`,
    qbom.some((d) => (d.metrics?.qber_percent ?? 0) > 11) && "Investigate QKD links with QBER above the 11% abort threshold.",
    cl.some((c) => !c.ok) && `Close ${cl.filter((c) => !c.ok).length} CERT-In readiness gap(s) listed in this report.`,
  ].filter(Boolean);

  return (<>
    <PageHead crumbs={crumbs} title="Reports & Export" subtitle="Download data or generate an executive summary."
      actions={<button className="btn btn-primary" disabled={!findings.length && !qbom.length} onClick={() => window.print()}><PrintIcon />Generate PDF report</button>} />
    <div className="grid-2">
      <section className="card"><h2>Export findings</h2><p className="muted" style={{ marginBottom: 14 }}>{findings.length} findings (schema-compliant JSON, or CSV).</p>
        <div className="toolbar"><button className="btn" disabled={!findings.length} onClick={() => exportJson(`qcbom-findings-${stamp}.json`, findings, { scan_timestamp: meta.scan_timestamp })}><DownloadIcon />JSON</button>
          <button className="btn" disabled={!findings.length} onClick={() => exportCsv(`qcbom-findings-${stamp}.csv`, findings, FINDING_COLS)}><DownloadIcon />CSV</button></div></section>
      <section className="card"><h2>Export QBOM</h2><p className="muted" style={{ marginBottom: 14 }}>{qbom.length} devices (schema-compliant JSON, or CSV).</p>
        <div className="toolbar"><button className="btn" disabled={!qbom.length} onClick={() => exportJson(`qcbom-qbom-${stamp}.json`, qbom, { scan_timestamp: meta.scan_timestamp })}><DownloadIcon />JSON</button>
          <button className="btn" disabled={!qbom.length} onClick={() => exportCsv(`qcbom-qbom-${stamp}.csv`, qbom, QBOM_COLS)}><DownloadIcon />CSV</button></div></section>
    </div>
    {!findings.length && !qbom.length ? <div className="card"><Empty title="Nothing to report">Ingest scan data first.</Empty></div> : (
      <div className="report">
        <div><img src="/qnnx-logo-full.png" alt="QNNX" style={{ height: 44, marginBottom: 10 }} /><div className="section-title">QCBOM</div><h1>Executive Summary — Quantum Cryptographic Posture</h1><p className="muted">Scan: {fmtTime(meta.scan_timestamp)} · Generated {fmtTime(new Date().toISOString())}</p></div>
        <div className="cards">
          <CounterCard label="Findings" value={s.total} tone="blue" /><CounterCard label="QBOM devices" value={s.devices} tone="brand" />
          <CounterCard label="Critical" value={s.critical} tone="red" /><CounterCard label="Quantum-vulnerable" value={s.vulnerable} tone="orange" />
        </div>
        <div className="grid-2">
          <div><h2>Risk counts</h2><div style={{ marginTop: 12 }}><HBars data={RISK_LEVELS.map((r) => ({ label: RISK_LABEL[r], value: s.levels[r] || 0, color: RISK_COLOR[r] }))} /></div></div>
          <div><h2>Quantum classification</h2><div style={{ marginTop: 12 }}><Donut label="Quantum classification" data={[{ label: "Broken", value: qc.broken || 0, color: "var(--red)" }, { label: "Weakened", value: (qc.weakened || 0) + (qc.unknown || 0), color: "var(--amber)" }, { label: "Safe", value: qc.safe || 0, color: "var(--green)" }]} /></div></div>
        </div>
        <div><h2>Key recommendations</h2><ol style={{ marginTop: 10 }}>{recs.length ? recs.map((r, i) => <li key={i}>{r}</li>) : <li>No immediate actions required.</li>}</ol></div>
        <div><h2>Top migration priorities</h2><ol style={{ marginTop: 10 }}>{mig.map((m) => <li key={m.asset}><b>{m.asset}</b> — {m.algorithms.join(", ")} ({m.modules.map((x) => MODULES[x]?.label).join(", ")})</li>)}</ol></div>
        <div><h2>CERT-In readiness</h2><p style={{ marginTop: 8 }}>{cl.filter((c) => c.ok).length} of {cl.length} controls met. Gaps: {cl.filter((c) => !c.ok).map((c) => c.title).join("; ") || "none"}.</p></div>
      </div>)}
  </>);
}
