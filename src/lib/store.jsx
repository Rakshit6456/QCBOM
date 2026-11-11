"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { SAMPLE_FINDINGS, SAMPLE_QBOM, SAMPLE_META, SAMPLE_HISTORY } from "./sample";
import { riskLevel } from "./analysis";

const KEY = "qcbom_data_v1";
const Ctx = createContext(null);
const EMPTY = { findings: [], qbom: [], meta: { scan_timestamp: null, scanner_versions: {} }, history: [], sources: [] };

export function DataProvider({ children }) {
  const [state, setState] = useState(EMPTY);
  const [ready, setReady] = useState(false);
  const ref = useRef(EMPTY);
  useEffect(() => { ref.current = state; }, [state]);

  useEffect(() => {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(KEY)); } catch {}
    setState(s || { findings: SAMPLE_FINDINGS, qbom: SAMPLE_QBOM, meta: SAMPLE_META, history: SAMPLE_HISTORY, sources: [{ name: "sample-data", at: SAMPLE_META.scan_timestamp, kind: "demo", count: SAMPLE_FINDINGS.length + SAMPLE_QBOM.length }] });
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  }, [state, ready]);

  /** Merge parsed files. Findings dedupe on (module, finding_id); devices on device_id. */
  const ingest = useCallback((name, kind, items, m) => {
    const s = ref.current;
    let added = 0, replaced = 0;
    const isDemo = s.sources.length > 0 && s.sources.every((x) => x.kind === "demo");
    const next = isDemo ? { ...EMPTY, meta: { scan_timestamp: null, scanner_versions: {} } } : { ...s, meta: { ...s.meta, scanner_versions: { ...s.meta.scanner_versions } } };
    const field = kind === "qbom" ? "qbom" : "findings";
    const keyOf = (x) => (kind === "qbom" ? x.device_id : `${x.module}::${x.finding_id}`);
    const map = new Map(next[field].map((x) => [keyOf(x), x]));
    for (const it of items) { map.has(keyOf(it)) ? replaced++ : added++; map.set(keyOf(it), it); }
    next[field] = [...map.values()];
    const mod = m?.module || (kind === "qbom" ? "quantum-python" : items[0]?.module);
    if (m?.scanner_version && mod) next.meta.scanner_versions[mod] = m.scanner_version;
    if (m?.scan_timestamp && (!next.meta.scan_timestamp || m.scan_timestamp > next.meta.scan_timestamp)) next.meta.scan_timestamp = m.scan_timestamp;
    if (!next.meta.scan_timestamp) next.meta.scan_timestamp = new Date().toISOString();
    next.sources = [...next.sources, { name, kind, at: new Date().toISOString(), count: items.length }];
    const lv = {}; next.findings.forEach((f) => { const r = riskLevel(f); lv[r] = (lv[r] || 0) + 1; });
    next.history = [...next.history, { at: new Date().toISOString().slice(0, 10), critical: lv.critical || 0, high: lv.high || 0, medium: lv.medium || 0, safe: lv.safe || 0 }];
    ref.current = next;
    setState(next);
    return { added, replaced };
  }, []);

  const loadSample = useCallback(() => setState({ findings: SAMPLE_FINDINGS, qbom: SAMPLE_QBOM, meta: SAMPLE_META, history: SAMPLE_HISTORY, sources: [{ name: "sample-data", at: SAMPLE_META.scan_timestamp, kind: "demo", count: SAMPLE_FINDINGS.length + SAMPLE_QBOM.length }] }), []);
  const clear = useCallback(() => setState(EMPTY), []);

  const value = useMemo(() => ({ ...state, ready, ingest, loadSample, clear }), [state, ready, ingest, loadSample, clear]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useData = () => useContext(Ctx);
