"use client";
import { Suspense, useState, use } from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import FindingsExplorer, { BASE_COLS } from "@/components/FindingsExplorer";
import { PageHead, CounterCard, QBadge, RiskBadge } from "@/components/ui";
import { KeyIcon, AlertsIcon, ZapIcon } from "@/components/Icons";
import { useData } from "@/lib/store";
import { SLUG_TO_MODULE, MODULES } from "@/lib/constants";
import { riskLevel, quantumClass, meta, weakReason } from "@/lib/analysis";

const pick = (...keys) => BASE_COLS.filter((c) => keys.includes(c.key));
const M = (label, k, render) => ({ key: "m_" + k, label, render: render || ((f) => meta(f, k) ?? "—"), sort: (f) => meta(f, k) });
const SEV = (f) => ["critical", "high", "medium", "safe"].indexOf(riskLevel(f));
const idCol = pick("finding_id"), algCols = pick("algorithm", "key_size", "q"), riskCol = pick("risk"), tail = pick("origin");

const parseLoc = (v) => { const m = String(v).match(/^(.*?):(\d+)$/); return m ? { file: m[1], line: m[2] } : { file: String(v), line: null }; };
const lang = (file) => ({ py: "Python", js: "JavaScript", ts: "TypeScript", java: "Java", go: "Go", c: "C", cpp: "C++", rs: "Rust", cbl: "COBOL" }[file.split(".").pop()] || "Other");

const SPECS = {
  "code-python": {
    columns: [...idCol, { key: "file", label: "Source file", render: (f) => <span className="mono">{parseLoc(f.evidence?.value).file}</span>, sort: (f) => parseLoc(f.evidence?.value).file },
      { key: "line", label: "Line", render: (f) => { const l = parseLoc(f.evidence?.value); return l.line ? <a className="chip" href={`vscode://file/${l.file}:${l.line}`} title="Open in VS Code">L{l.line}</a> : "—"; }, sort: (f) => +parseLoc(f.evidence?.value).line },
      { key: "lang", label: "Language", render: (f) => lang(parseLoc(f.evidence?.value).file) }, ...algCols, ...riskCol, ...tail],
  },
  "binary-cpp": { columns: [...idCol, M("Binary", "binary", (f) => <span className="mono">{meta(f, "binary") ?? "—"}</span>), { key: "offset", label: "Offset", render: (f) => <span className="mono">{f.evidence?.value}</span>, sort: (f) => f.evidence?.value }, M("Container", "container", (f) => <span className="chip">{meta(f, "container") ?? "—"}</span>), M("Arch", "arch"), ...algCols, ...riskCol] },
  "network-go": { columns: [...idCol, M("Target (host:port)", "target", (f) => <span className="mono">{meta(f, "target") ?? "—"}</span>), M("TLS", "tls_version"), M("Cert serial", "cert_serial", (f) => <span className="mono">{meta(f, "cert_serial") ?? "—"}</span>), M("SSH banner", "ssh_banner", (f) => <span className="mono">{meta(f, "ssh_banner") ?? "—"}</span>), ...algCols, ...riskCol] },
  "cloud-go": { columns: [...idCol, M("Provider", "provider", (f) => <span className="badge badge-blue">{meta(f, "provider") ?? "—"}</span>), { key: "arn", label: "Key ARN / URI", render: (f) => <span className="mono">{f.evidence?.value}</span>, sort: (f) => f.evidence?.value },
      M("State", "key_state", (f) => { const s = meta(f, "key_state"); return <span className={`badge ${s === "enabled" ? "badge-green" : s ? "badge-red" : "badge-grey"}`}>{s ?? "—"}</span>; }),
      M("Rotation", "rotation", (f) => { const s = meta(f, "rotation"); return <span className={`badge ${s === "enabled" ? "badge-green" : "badge-amber"}`}>{s ?? "—"}</span>; }), ...algCols, ...riskCol] },
  "mainframe-java": { columns: [...idCol, M("System ID", "system_id", (f) => <b className="mono">{meta(f, "system_id") ?? "—"}</b>), { key: "ctx", label: "Banking context", wrap: true, render: (f) => meta(f, "context") ?? "—", sort: (f) => meta(f, "context") }, ...algCols, ...riskCol, ...tail] },
};

export default function Page({ params }) {
  const { slug } = use(params);
  const module = SLUG_TO_MODULE[slug];
  if (!module) notFound();
  if (module === "quantum-python") redirect("/qbom");
  const { findings, meta: sm, ready } = useData();
  const [open, setOpen] = useState(null);
  const mine = findings.filter((f) => f.module === module);
  const spec = SPECS[module];
  const m = MODULES[module];
  const crumbs = [{ label: "Dashboard", href: "/dashboard" }, { label: m.label, href: open ? `/modules/${slug}` : undefined }, ...(open ? [{ label: open.finding_id }] : [])];

  const byFile = module === "code-python" ? Object.entries(mine.reduce((a, f) => { const l = lang(parseLoc(f.evidence?.value).file); a[l] = (a[l] || 0) + 1; return a; }, {})) : [];

  return (<>
    <PageHead crumbs={crumbs} title={`${m.label} findings`} subtitle={`${m.desc} · module ${module}${sm.scanner_versions?.[module] ? ` v${sm.scanner_versions[module]}` : ""}`} />
    {ready && mine.length > 0 && (
      <div className="cards">
        <CounterCard label="Findings" value={mine.length} icon={<KeyIcon />} tone="blue" />
        <CounterCard label="Critical" value={mine.filter((f) => riskLevel(f) === "critical").length} icon={<AlertsIcon />} tone="red" />
        <CounterCard label="Quantum-vulnerable" value={mine.filter((f) => quantumClass(f) === "broken").length} icon={<ZapIcon />} tone="orange" />
        {module === "cloud-go" && <CounterCard label="Keys not enabled" value={mine.filter((f) => meta(f, "key_state") && meta(f, "key_state") !== "enabled").length} tone="amber" />}
        {module === "cloud-go" && ["AWS", "Azure", "GCP"].map((p) => <CounterCard key={p} label={p} value={mine.filter((f) => meta(f, "provider") === p).length} tone="grey" />)}
        {module === "network-go" && <CounterCard label="Legacy TLS" value={mine.filter((f) => /1\.[01]$/.test(String(meta(f, "tls_version")))).length} tone="amber" />}
        {byFile.map(([l, n]) => <CounterCard key={l} label={l} value={n} tone="grey" />)}
      </div>)}
    <Suspense><FindingsExplorer module={module} columns={spec.columns} onOpenChange={setOpen} exportName={`qcbom-${slug}`} /></Suspense>
  </>);
}
