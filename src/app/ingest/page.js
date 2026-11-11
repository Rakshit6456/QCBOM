"use client";
import { useRef, useState } from "react";
import { useData } from "@/lib/store";
import { PageHead, fmtTime } from "@/components/ui";
import { UploadIcon } from "@/components/Icons";
import { parseUpload } from "@/lib/validate";
import { useRouter } from "next/navigation";

export default function Page() {
  const { ingest, loadSample, clear, sources, findings, qbom } = useData();
  const router = useRouter();
  const input = useRef(null);
  const [over, setOver] = useState(false);
  const [results, setResults] = useState([]);

  async function handle(files) {
    const out = [];
    for (const file of files) {
      const text = await file.text();
      const r = parseUpload(file.name, text);
      if (r.fatal) { out.push({ name: file.name, fatal: r.fatal }); continue; }
      const merge = r.items.length ? ingest(file.name, r.kind, r.items, r.meta) : { added: 0, replaced: 0 };
      out.push({ name: file.name, kind: r.kind, total: r.total, ok: r.items.length, errors: r.errors, ...merge });
    }
    setResults((p) => [...out, ...p]);
  }

  return (<>
    <PageHead crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Data Ingest" }]} title="Data Ingest" subtitle="Upload *-findings.json and qbom-findings.json. Files are validated in your browser and merged on (module, finding_id)." />
    <div className={`dropzone${over ? " over" : ""}`} role="button" tabIndex={0}
      onClick={() => input.current?.click()} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); handle([...e.dataTransfer.files]); }}>
      <UploadIcon /><b>Drop JSON files here or click to browse</b><span className="muted">Multiple files allowed — each scanner run is merged and de-duplicated.</span>
      <input ref={input} type="file" accept=".json,application/json" multiple hidden onChange={(e) => { handle([...e.target.files]); e.target.value = ""; }} />
    </div>
    <div className="toolbar">
      <button className="btn" onClick={() => { loadSample(); setResults([]); }}>Load demo data</button>
      <button className="btn" onClick={() => { if (confirm("Remove all ingested data from this browser?")) { clear(); setResults([]); } }}>Clear all data</button>
      <span className="muted">Currently loaded: {findings.length} findings, {qbom.length} devices</span>
      {(findings.length > 0 || qbom.length > 0) && <button className="btn btn-primary" onClick={() => router.push("/dashboard")}>View dashboard</button>}
    </div>

    {results.map((r, i) => (
      <section key={i} className="card"><h2>{r.name}{!r.fatal && <span className={`badge ${r.errors.length ? "badge-amber" : "badge-green"}`}>{r.errors.length ? `${r.errors.length} error(s)` : "valid"}</span>}</h2>
        {r.fatal ? <div className="notice notice-red">{r.fatal}</div> : (<>
          <p>Detected <b>{r.kind === "qbom" ? "QBOM" : "CBOM findings"}</b> · {r.ok} of {r.total} entries valid · <b>{r.added}</b> added, <b>{r.replaced}</b> replaced (duplicate key).</p>
          {r.errors.length > 0 && <><p className="muted" style={{ margin: "10px 0 6px" }}>Invalid entries were skipped:</p><ul className="errlist">{r.errors.slice(0, 100).map((e, j) => <li key={j} className="notice notice-red"><code>{e.path}</code> {e.msg}</li>)}</ul></>}
        </>)}
      </section>))}

    <section className="card"><h2>Ingest history</h2>
      {sources.length === 0 ? <p className="muted">Nothing ingested yet.</p> :
        <div className="table-wrap" style={{ boxShadow: "none" }}><table><thead><tr><th>File</th><th>Kind</th><th>Entries</th><th>When</th></tr></thead><tbody>{[...sources].reverse().map((s, i) => <tr key={i}><td className="mono">{s.name}</td><td>{s.kind}</td><td>{s.count}</td><td>{fmtTime(s.at)}</td></tr>)}</tbody></table></div>}
    </section>
  </>);
}
