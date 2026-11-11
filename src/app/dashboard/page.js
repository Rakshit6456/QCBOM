"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useData } from "@/lib/store";
import { PageHead, CounterCard, PageSkeleton, Empty, fmtTime } from "@/components/ui";
import { Donut, HBars, Heatmap, LineChart } from "@/components/Charts";
import { KeyIcon, ChipIcon, AlertsIcon, ClockIcon, ZapIcon, LockIcon, ShieldIcon } from "@/components/Icons";
import { summarise, count, riskLevel } from "@/lib/analysis";
import { MODULES, RISK_LEVELS, RISK_LABEL, RISK_COLOR, DEVICE_TYPES, DEVICE_LABEL, ASSET_TYPES } from "@/lib/constants";

const MOD_KEYS = Object.keys(MODULES).filter((m) => m !== "quantum-python");
const AT_COLOR = { certificate: "var(--blue)", key: "var(--brand-text)", library: "var(--amber)", protocol: "var(--green)", device: "var(--orange)" };

export default function Dashboard() {
  const { findings, qbom, meta, history, ready } = useData();
  const router = useRouter();
  if (!ready) return <PageSkeleton />;
  const s = summarise(findings, qbom);
  if (!findings.length && !qbom.length) return (<><PageHead title="Dashboard" /><div className="card"><Empty title="No scan data yet" action={<Link className="btn btn-primary" href="/ingest">Upload scan files</Link>}>Upload <code>*-findings.json</code> and <code>qbom-findings.json</code> files, or load the demo data.</Empty></div></>);

  const byMod = count(findings, (f) => f.module);
  const byType = count(findings, (f) => f.asset_type);
  const byDev = count(qbom, (d) => d.device_type);
  const heatRows = MOD_KEYS.map((m) => ({ key: m, label: MODULES[m].label }));
  const heatCols = RISK_LEVELS.map((r) => ({ key: r, label: RISK_LABEL[r], color: RISK_COLOR[r] }));
  const heat = (r, c) => findings.filter((f) => f.module === r.key && riskLevel(f) === c.key).length;
  const total = Math.max(1, s.total);

  return (<>
    <PageHead title="Dashboard" subtitle="Cryptographic posture and quantum readiness at a glance." />
    <div className="cards">
      <CounterCard label="Total findings" value={s.total} icon={<KeyIcon />} tone="blue" onClick={() => router.push("/findings")} />
      <CounterCard label="QBOM devices" value={s.devices} icon={<ChipIcon />} tone="brand" onClick={() => router.push("/qbom")} />
      <CounterCard label="Critical assets" value={s.critical} icon={<AlertsIcon />} tone="red" onClick={() => router.push("/findings?risk=critical")} />
      <CounterCard label="Weak crypto" value={s.weak} icon={<LockIcon />} tone="amber" sub="DES · MD5 · RSA-1024 · TLS 1.0" />
      <CounterCard label="Quantum-vulnerable" value={s.vulnerable} icon={<ZapIcon />} tone="orange" onClick={() => router.push("/risk")} />
      <CounterCard label="Last scan" value={fmtTime(meta.scan_timestamp)} icon={<ClockIcon />} tone="grey" small />
    </div>

    <div className="grid-2">
      <section className="card"><h2>Risk heatmap <span className="h2-sub">module × risk level</span></h2>
        <Heatmap rows={heatRows} cols={heatCols} get={heat} onCell={(r, c) => router.push(`/findings?risk=${c.key}`)} /></section>
      <section className="card"><h2>Severity breakdown</h2>
        <HBars data={RISK_LEVELS.map((r) => ({ label: RISK_LABEL[r], value: s.levels[r] || 0, color: RISK_COLOR[r], title: `${Math.round(((s.levels[r] || 0) / total) * 100)}%` }))} />
        <p className="card-sub" style={{ marginTop: 14 }}>Critical = deprecated/insecure today. High = quantum-broken. Medium = weakened. Safe = quantum-resistant.</p></section>
    </div>

    <div className="grid-2">
      <section className="card"><h2>Module coverage <span className="h2-sub">scanners that ran</span></h2>
        <div className="cov-list">{[...MOD_KEYS, "quantum-python"].map((m) => {
          const n = m === "quantum-python" ? qbom.length : byMod[m] || 0;
          const max = Math.max(1, qbom.length, ...Object.values(byMod));
          return (
            <Link key={m} href={MODULES[m].route} className="cov-row">
              <span className="cov-name"><b style={{ fontWeight: 600 }}>{MODULES[m].label}</b><small>{m}</small></span>
              <div className="hbar-track"><div className="hbar-fill" style={{ width: `${(n / max) * 100}%` }} /></div>
              <span className="cov-count">{n ? <b>{n}</b> : <span className="badge badge-grey">not run</span>}</span>
            </Link>);
        })}</div>
      </section>
      <section className="card"><h2>Asset type distribution</h2>
        <Donut label="Asset types" data={ASSET_TYPES.filter((t) => byType[t]).map((t) => ({ label: t[0].toUpperCase() + t.slice(1) + "s", value: byType[t], color: AT_COLOR[t] }))} /></section>
    </div>

    <div className="grid-2">
      <section className="card"><h2>Quantum estate <span className="h2-sub">from QBOM</span></h2>
        {qbom.length === 0 ? <Empty title="Scan not yet run">No QBOM entries ingested.</Empty> :
          <div className="cards" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            {DEVICE_TYPES.map((t) => <CounterCard key={t} label={t === "qpu" ? "QPUs" : t === "qkd" ? "QKD devices" : t === "qrng" ? "QRNGs" : t === "pqc_hardware" ? "PQC HSMs" : t === "qpu_simulator" ? "Simulators" : "SDKs"} value={byDev[t] || 0} tone={byDev[t] ? "brand" : "grey"} onClick={() => router.push(`/qbom?type=${t}`)} />)}
          </div>}</section>
      <section className="card"><h2>Scan history <span className="h2-sub">trend over time</span></h2>
        {history.length < 2 ? <Empty title="Not enough history">Ingest more scans to see a trend.</Empty> :
          <LineChart points={history} series={RISK_LEVELS.map((r) => ({ key: r, label: RISK_LABEL[r], color: RISK_COLOR[r] }))} />}</section>
    </div>
  </>);
}
