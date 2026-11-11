export function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const cell = (v) => {
  let s = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
  if (/^[=+\-@]/.test(s)) s = "'" + s; // spreadsheet formula guard
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export function toCsv(rows, cols) {
  return [cols.map((c) => c.label).join(","), ...rows.map((r) => cols.map((c) => cell(c.get(r))).join(","))].join("\n");
}
export const exportJson = (name, items, meta) => download(name, JSON.stringify({ schema_version: "1.0", ...meta, count: items.length, items }, null, 2), "application/json");
export const exportCsv = (name, rows, cols) => download(name, toCsv(rows, cols), "text/csv");
export const FINDING_COLS = [
  { label: "finding_id", get: (r) => r.finding_id }, { label: "module", get: (r) => r.module }, { label: "asset_type", get: (r) => r.asset_type },
  { label: "algorithm", get: (r) => r.algorithm }, { label: "key_size", get: (r) => r.key_size }, { label: "origin", get: (r) => r.origin },
  { label: "reference_type", get: (r) => r.evidence?.reference_type }, { label: "evidence_value", get: (r) => r.evidence?.value }, { label: "fingerprint", get: (r) => r.fingerprint },
];
export const QBOM_COLS = [
  { label: "device_id", get: (r) => r.device_id }, { label: "device_type", get: (r) => r.device_type }, { label: "model", get: (r) => r.model },
  { label: "vendor", get: (r) => r.vendor }, { label: "vendor_country", get: (r) => r.vendor_country }, { label: "origin", get: (r) => r.origin },
  { label: "firmware_version", get: (r) => r.firmware_version }, { label: "software_version", get: (r) => r.software_version },
  { label: "communication_protocol", get: (r) => r.communication_protocol }, { label: "license", get: (r) => r.license },
  { label: "attestation", get: (r) => r.attestation?.status }, { label: "qber_percent", get: (r) => r.metrics?.qber_percent }, { label: "key_rate_bps", get: (r) => r.metrics?.key_rate_bps },
  { label: "qubit_count", get: (r) => r.metrics?.qubit_count }, { label: "measured_at", get: (r) => r.metrics?.measured_at },
];
