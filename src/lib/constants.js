export const MODULES = {
  "code-python": { label: "Code", slug: "code", route: "/modules/code", desc: "Static source analysis (Python)" },
  "binary-cpp": { label: "Binary", slug: "binary", route: "/modules/binary", desc: "ELF / PE / Mach-O binary scanning" },
  "network-go": { label: "Network", slug: "network", route: "/modules/network", desc: "TLS / SSH endpoint scanning" },
  "cloud-go": { label: "Cloud", slug: "cloud", route: "/modules/cloud", desc: "AWS / Azure / GCP key vaults and KMS" },
  "mainframe-java": { label: "Mainframe", slug: "mainframe", route: "/modules/mainframe", desc: "Banking mainframe crypto" },
  "quantum-python": { label: "Quantum", slug: "quantum", route: "/qbom", desc: "Quantum device estate (QBOM)" },
};
export const SLUG_TO_MODULE = Object.fromEntries(Object.entries(MODULES).map(([k, v]) => [v.slug, k]));
export const ASSET_TYPES = ["certificate", "key", "library", "protocol", "device"];
export const ORIGINS = ["detected", "inferred", "enriched"];
export const REF_TYPES = ["source", "binary", "network", "cloud", "mainframe", "config", "device"];
export const DEVICE_TYPES = ["qpu", "qpu_simulator", "qkd", "qrng", "pqc_hardware", "sdk"];
export const DEVICE_LABEL = { qpu: "QPU", qpu_simulator: "Simulator", qkd: "QKD device", qrng: "QRNG", pqc_hardware: "PQC HSM", sdk: "SDK" };
export const SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
export const RISK_LEVELS = ["critical", "high", "medium", "safe"];
export const RISK_LABEL = { critical: "Critical", high: "High", medium: "Medium", safe: "Safe" };
export const RISK_COLOR = { critical: "var(--red)", high: "var(--orange)", medium: "var(--amber)", safe: "var(--green)" };
