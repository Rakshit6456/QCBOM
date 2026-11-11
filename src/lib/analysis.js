// Quantum-risk classification and derived views. Pure functions over finding objects.
const BROKEN = /\b(rsa|ecdsa|ecdh|ecc|ec|dh|dsa|diffie|ed25519|ed448|x25519|x448|secp\d+|p-?(256|384|521))\b/i;
const SAFE = /(aes[-_ ]?256|aes[-_ ]?192|sha[-_ ]?(256|384|512)|sha3|ml-?kem|ml-?dsa|slh-?dsa|kyber|dilithium|sphincs|xmss|lms|hss|chacha20|falcon|hmac-sha(256|384|512))/i;
const WEAKENED = /(aes[-_ ]?128|sha[-_ ]?(1|224)\b|3des|triple|des\b|md5|md4|rc4|rc2|blowfish|tls[ _-]?v?1\.[01]\b)/i;

export function normAlg(a) { return String(a || "").trim(); }

/** "broken" | "weakened" | "safe" | "unknown" */
export function quantumClass(f) {
  const a = normAlg(f.algorithm);
  if (SAFE.test(a)) return "safe";
  if (BROKEN.test(a)) return "broken";
  if (WEAKENED.test(a)) return "weakened";
  return "unknown";
}

/** Deprecated / insecure today (independent of quantum). Returns reason string or null. */
export function weakReason(f) {
  const a = normAlg(f.algorithm);
  const ks = Number(f.key_size);
  if (/^des\b|\bdes[-_ ]?(cbc|ecb)?$/i.test(a) && !/3des/i.test(a)) return "DES is broken";
  if (/3des|triple[-_ ]?des/i.test(a)) return "3DES is deprecated";
  if (/md5|md4/i.test(a)) return "MD5 is broken";
  if (/sha[-_ ]?1\b/i.test(a)) return "SHA-1 is deprecated";
  if (/rc4|rc2/i.test(a)) return "RC4/RC2 is insecure";
  if (/rsa/i.test(a) && ks && ks < 2048) return `RSA-${ks} is below 2048 bits`;
  if (/tls[ _-]?v?1\.[01]\b|tlsv1(\.1)?$|^tls1(\.1)?$/i.test(a) || /tls[ _-]?v?1\.[01]\b/i.test(String(f.metadata?.tls_version || f.tls_version || ""))) return "TLS 1.0/1.1 is deprecated";
  return null;
}

/** critical | high | medium | safe */
export function riskLevel(f) {
  const q = quantumClass(f);
  if (weakReason(f)) return "critical";
  if (q === "broken") return "high";
  if (q === "weakened" || q === "unknown") return "medium";
  return "safe";
}

export const QCLASS = {
  broken: { label: "Quantum-Broken", cls: "badge-red" },
  weakened: { label: "Weakened", cls: "badge-amber" },
  safe: { label: "Quantum-Safe", cls: "badge-green" },
  unknown: { label: "Unclassified", cls: "badge-grey" },
};

export function meta(f, k) { return f.metadata?.[k] ?? f[k] ?? f.evidence?.[k]; }

export function keySizeBucket(f) {
  const k = Number(f.key_size);
  if (!f.key_size && f.key_size !== 0) return "none";
  if (k < 128) return "<128";
  if (k < 256) return "128–255";
  if (k < 2048) return "256–2047";
  if (k < 4096) return "2048–4095";
  return "≥4096";
}
export const KEY_BUCKETS = ["<128", "128–255", "256–2047", "2048–4095", "≥4096", "none"];

export function count(arr, fn) {
  const m = {};
  for (const x of arr) { const k = fn(x); if (k != null) m[k] = (m[k] || 0) + 1; }
  return m;
}

export function summarise(findings, qbom) {
  const levels = count(findings, riskLevel);
  return {
    total: findings.length,
    devices: qbom.length,
    critical: levels.critical || 0,
    weak: findings.filter(weakReason).length,
    vulnerable: findings.filter((f) => quantumClass(f) === "broken").length,
    levels,
  };
}

/** Asset key used for grouping: correlation-store asset_key (not fingerprint). */
export function assetKey(f) { return f.asset_key || f.correlation?.asset_key || null; }

export function correlate(findings) {
  const groups = {};
  for (const f of findings) { const k = assetKey(f); if (k) (groups[k] ||= []).push(f); }
  return Object.entries(groups).map(([key, items]) => ({
    key, items,
    modules: [...new Set(items.map((i) => i.module))],
    worst: ["critical", "high", "medium", "safe"].find((l) => items.some((i) => riskLevel(i) === l)),
  })).sort((a, b) => b.modules.length - a.modules.length || b.items.length - a.items.length);
}

function isInternetFacing(f) {
  if (f.module !== "network-go") return false;
  const t = String(f.target || f.metadata?.target || "");
  return t && !/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|127\.|localhost)/.test(t);
}

export function migrationList(findings) {
  const groups = {};
  for (const f of findings) {
    const q = quantumClass(f);
    if (q === "safe") continue;
    const id = assetKey(f) || `${f.module}:${f.target || f.metadata?.target || f.evidence?.value}`;
    (groups[id] ||= []).push(f);
  }
  return Object.entries(groups).map(([asset, items]) => {
    const vuln = items.some((i) => quantumClass(i) === "broken");
    const weak = items.some(weakReason);
    const net = items.some(isInternetFacing);
    const score = (vuln ? 50 : 15) + (weak ? 30 : 0) + (net ? 20 : 0) + Math.min(items.length, 5);
    return { asset, items, vuln, weak, net, score,
      algorithms: [...new Set(items.map((i) => i.algorithm))],
      modules: [...new Set(items.map((i) => i.module))],
      action: vuln ? "Migrate to ML-KEM / ML-DSA (hybrid first)" : weak ? "Replace deprecated primitive" : "Upgrade to AES-256 / SHA-256+" };
  }).sort((a, b) => b.score - a.score);
}

/** Indicative mapping of findings to quantum-readiness controls. */
export function certInChecklist(findings, qbom) {
  const has = (fn) => findings.some(fn);
  const pqc = findings.filter((f) => quantumClass(f) === "safe" && /ml-?kem|ml-?dsa|kyber|dilithium|xmss|lms|sphincs|slh/i.test(f.algorithm));
  const tlsOld = has((f) => /tls[ _-]?v?1\.[01]\b/i.test(f.algorithm + " " + (meta(f, "tls_version") || "")));
  const rsaSmall = has((f) => /rsa/i.test(f.algorithm) && f.key_size && f.key_size < 2048);
  const deprecated = findings.filter((f) => weakReason(f) && !/rsa/i.test(f.algorithm));
  const broken = findings.filter((f) => quantumClass(f) === "broken");
  const cloudKeysOff = has((f) => f.module === "cloud-go" && ["disabled", "pending_deletion"].includes(String(meta(f, "key_state"))));
  const unverified = qbom.filter((d) => (d.attestation?.status || "none") !== "verified");
  const mods = new Set(findings.map((f) => f.module));
  return [
    { id: "C1", title: "Cryptographic inventory (CBOM) maintained", ok: findings.length > 0, detail: `${findings.length} assets inventoried across ${mods.size} module(s)` },
    { id: "C2", title: "Scan coverage across code, binary, network, cloud and mainframe", ok: ["code-python", "binary-cpp", "network-go", "cloud-go", "mainframe-java"].every((m) => mods.has(m)), detail: `${["code-python", "binary-cpp", "network-go", "cloud-go", "mainframe-java"].filter((m) => !mods.has(m)).map((m) => MODNAME(m)).join(", ") || "All"} ${mods.size >= 5 ? "covered" : "not yet scanned"}` },
    { id: "C3", title: "No deprecated algorithms (DES, 3DES, MD5, SHA-1)", ok: deprecated.length === 0, detail: `${deprecated.length} finding(s) use deprecated primitives` },
    { id: "C4", title: "No RSA keys below 2048 bits", ok: !rsaSmall, detail: rsaSmall ? "Weak RSA keys present" : "None found" },
    { id: "C5", title: "TLS 1.2 or higher enforced", ok: !tlsOld, detail: tlsOld ? "TLS 1.0/1.1 endpoints found" : "No legacy TLS found" },
    { id: "C6", title: "Quantum-vulnerable public-key crypto has migration plan", ok: broken.length === 0, detail: `${broken.length} quantum-vulnerable assets pending migration` },
    { id: "C7", title: "Post-quantum algorithms (ML-KEM / ML-DSA) deployed", ok: pqc.length > 0, detail: `${pqc.length} PQC asset(s) detected` },
    { id: "C8", title: "Cloud key lifecycle healthy (enabled, rotated)", ok: !cloudKeysOff, detail: cloudKeysOff ? "Disabled / pending-deletion keys found" : "No lifecycle issues found" },
    { id: "C9", title: "Quantum hardware attested", ok: qbom.length > 0 && unverified.length === 0, detail: qbom.length ? `${unverified.length} of ${qbom.length} device(s) not attested` : "No QBOM ingested" },
  ];
}
const MODNAME = (m) => ({ "code-python": "Code", "binary-cpp": "Binary", "network-go": "Network", "cloud-go": "Cloud", "mainframe-java": "Mainframe" }[m] || m);
