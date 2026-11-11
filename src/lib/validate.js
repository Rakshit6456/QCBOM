import { ASSET_TYPES, ORIGINS, MODULES, DEVICE_TYPES, SEVERITIES } from "./constants";

const isObj = (x) => x && typeof x === "object" && !Array.isArray(x);
const str = (x) => typeof x === "string" && x.length > 0;

export function validateFinding(f, i = 0) {
  const e = [];
  const p = `findings[${i}]`;
  if (!isObj(f)) return [{ path: p, msg: "must be an object" }];
  if (!str(f.finding_id)) e.push({ path: `${p}.finding_id`, msg: "required string" });
  if (!ASSET_TYPES.includes(f.asset_type)) e.push({ path: `${p}.asset_type`, msg: `must be one of ${ASSET_TYPES.join(", ")}` });
  if (!str(f.algorithm)) e.push({ path: `${p}.algorithm`, msg: "required string" });
  if (f.key_size != null && !(Number.isInteger(f.key_size) && f.key_size >= 0)) e.push({ path: `${p}.key_size`, msg: "must be a non-negative integer or null" });
  if (!ORIGINS.includes(f.origin)) e.push({ path: `${p}.origin`, msg: `must be one of ${ORIGINS.join(", ")}` });
  if (!(f.module in MODULES)) e.push({ path: `${p}.module`, msg: `must be one of ${Object.keys(MODULES).join(", ")}` });
  if (!isObj(f.evidence)) e.push({ path: `${p}.evidence`, msg: "required object" });
  else {
    if (!str(f.evidence.reference_type)) e.push({ path: `${p}.evidence.reference_type`, msg: "required string" });
    if (f.evidence.value == null || f.evidence.value === "") e.push({ path: `${p}.evidence.value`, msg: "required" });
  }
  if (f.fingerprint != null && !str(f.fingerprint)) e.push({ path: `${p}.fingerprint`, msg: "must be a string when present" });
  return e;
}

export function validateDevice(d, i = 0) {
  const e = [];
  const p = `devices[${i}]`;
  if (!isObj(d)) return [{ path: p, msg: "must be an object" }];
  if (!str(d.device_id)) e.push({ path: `${p}.device_id`, msg: "required string" });
  if (!DEVICE_TYPES.includes(d.device_type)) e.push({ path: `${p}.device_type`, msg: `must be one of ${DEVICE_TYPES.join(", ")}` });
  if (!str(d.vendor)) e.push({ path: `${p}.vendor`, msg: "required string" });
  if (d.vendor_country != null && !/^[A-Z]{2}$/.test(d.vendor_country)) e.push({ path: `${p}.vendor_country`, msg: "must be ISO 3166-1 alpha-2" });
  if (!ORIGINS.includes(d.origin)) e.push({ path: `${p}.origin`, msg: `must be one of ${ORIGINS.join(", ")}` });
  (d.vulnerabilities || []).forEach((v, j) => { if (!SEVERITIES.includes(String(v.severity).toUpperCase())) e.push({ path: `${p}.vulnerabilities[${j}].severity`, msg: `must be one of ${SEVERITIES.join(", ")}` }); });
  const att = d.attestation?.status;
  if (att != null && !["verified", "unverified", "none"].includes(att)) e.push({ path: `${p}.attestation.status`, msg: "must be verified, unverified or none" });
  return e;
}

/** Parse + validate an uploaded file. Returns { kind, items, errors, meta, fatal } */
export function parseUpload(name, text) {
  let json;
  try { json = JSON.parse(text); } catch (err) { return { fatal: `Invalid JSON: ${err.message}`, errors: [], items: [] }; }
  const arr = Array.isArray(json) ? json : Array.isArray(json.findings) ? json.findings : Array.isArray(json.devices) ? json.devices : Array.isArray(json.entries) ? json.entries : null;
  if (!arr) return { fatal: "Expected an array or an object with a findings / devices array.", errors: [], items: [] };
  const isQbom = /qbom/i.test(name) || arr.some((x) => x && x.device_type);
  const items = [], errors = [];
  arr.forEach((x, i) => {
    const e = isQbom ? validateDevice(x, i) : validateFinding(x, i);
    if (e.length) errors.push(...e); else items.push(x);
  });
  const m = isObj(json) ? { scan_timestamp: json.scan_timestamp || json.generated_at, scanner_version: json.scanner_version || json.version, module: json.module } : {};
  return { kind: isQbom ? "qbom" : "findings", items, errors, total: arr.length, meta: m };
}
