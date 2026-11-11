"use client";
import { useState } from "react";
import { Drawer, Tabs, KV, JsonView, QBadge, RiskBadge, ValidNote } from "./ui";
import { quantumClass, riskLevel, weakReason, meta } from "@/lib/analysis";
import { MODULES } from "@/lib/constants";
import { validateFinding } from "@/lib/validate";

export default function FindingDrawer({ f, onClose, related = [], onOpen }) {
  const [tab, setTab] = useState("details");
  const errs = validateFinding(f);
  const weak = weakReason(f);
  const extras = [
    ["Target", meta(f, "target")], ["TLS version", meta(f, "tls_version")], ["Certificate serial", meta(f, "cert_serial")], ["SSH banner", meta(f, "ssh_banner")],
    ["Cloud provider", meta(f, "provider")], ["Key state", meta(f, "key_state")], ["Rotation", meta(f, "rotation")],
    ["Container", meta(f, "container")], ["Architecture", meta(f, "arch")], ["Binary", meta(f, "binary")],
    ["Mainframe system", meta(f, "system_id")], ["Context", meta(f, "context")],
  ];
  return (
    <Drawer title={`${f.algorithm}${f.key_size ? `-${f.key_size}` : ""}`} onClose={onClose} badge={<span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><RiskBadge f={f} /><QBadge f={f} /><span className="chip">{f.finding_id}</span></span>}>
      <Tabs value={tab} onChange={setTab} tabs={[["details", "Details"], ["evidence", "Evidence"], ["json", "Raw JSON"]]} />
      {tab === "details" && (<>
        {weak && <div className="notice notice-red"><b>Weak crypto:</b> {weak}.</div>}
        {quantumClass(f) === "broken" && <div className="notice notice-amber">Vulnerable to Shor&apos;s algorithm on a cryptographically relevant quantum computer. Plan migration to ML-KEM / ML-DSA.</div>}
        <KV rows={[["Finding ID", f.finding_id], ["Module", `${f.module} (${MODULES[f.module]?.label})`], ["Asset type", f.asset_type], ["Algorithm", f.algorithm], ["Key size", f.key_size ?? "n/a"], ["Origin", f.origin], ["Fingerprint", f.fingerprint && <span className="mono">{f.fingerprint}</span>], ["Asset key", f.asset_key && <span className="mono">{f.asset_key}</span>], ...extras]} />
        {related.length > 1 && (<div><div className="section-title">Same asset, seen by {related.length} findings</div>
          <div style={{ display: "grid", gap: 6 }}>{related.filter((r) => r !== f).map((r) => <button key={r.module + r.finding_id} className="btn" style={{ justifyContent: "space-between" }} onClick={() => onOpen?.(r)}><span>{r.module} · {r.algorithm}</span><span className="mono muted">{r.finding_id}</span></button>)}</div></div>)}
      </>)}
      {tab === "evidence" && (<>
        <KV rows={[["Reference type", f.evidence?.reference_type], ["Value", <span className="mono">{String(f.evidence?.value)}</span>]]} />
        <JsonView data={f.evidence || {}} />
      </>)}
      {tab === "json" && (<>
        {errs.length === 0 ? <ValidNote>Valid against finding.schema.json</ValidNote>
          : <div className="notice notice-red"><b>Schema errors</b><ul className="errlist">{errs.map((e, i) => <li key={i}><code>{e.path}</code> {e.msg}</li>)}</ul></div>}
        <JsonView data={f} />
      </>)}
    </Drawer>
  );
}
