// Demo data shaped like the scanner outputs (*-findings.json and qbom-findings.json).
let n = 0;
const F = (module, asset_type, algorithm, key_size, origin, reference_type, value, extra = {}) => ({
  finding_id: `F-${String(++n).padStart(4, "0")}`, module, asset_type, algorithm, key_size, origin,
  evidence: { reference_type, value }, ...extra,
});

const code = [
  F("code-python", "key", "RSA", 1024, "detected", "source", "weak_crypto.py:7", { asset_key: "asset:payments-api" }),
  F("code-python", "library", "MD5", null, "detected", "source", "auth/hash_utils.py:42"),
  F("code-python", "key", "AES-128", 128, "detected", "source", "services/vault.py:118", { asset_key: "asset:vault-svc" }),
  F("code-python", "key", "AES-256", 256, "detected", "source", "services/storage.py:23"),
  F("code-python", "library", "SHA-1", null, "detected", "source", "legacy/sign.py:88"),
  F("code-python", "key", "ECDSA", 256, "detected", "source", "api/jwt.py:31", { asset_key: "asset:payments-api" }),
  F("code-python", "library", "SHA-256", null, "detected", "source", "utils/digest.py:12"),
  F("code-python", "key", "DES", 56, "detected", "source", "legacy/crypt.py:5"),
  F("code-python", "library", "ML-KEM-768", null, "detected", "source", "pqc/kem.py:9", { fingerprint: "sha256:9c1f0a77e2" }),
  F("code-python", "key", "RSA", 2048, "inferred", "source", "api/tls_ctx.py:64"),
  F("code-python", "protocol", "DH", 2048, "detected", "source", "net/handshake.py:140"),
];
const binary = [
  F("binary-cpp", "library", "OpenSSL RSA", 2048, "detected", "binary", "0x0001a2f0", { metadata: { container: "ELF", arch: "x86_64", binary: "/usr/local/bin/gateway" }, fingerprint: "sha256:41ab88ee01", asset_key: "asset:gateway" }),
  F("binary-cpp", "library", "3DES", 168, "detected", "binary", "0x00042b10", { metadata: { container: "PE", arch: "x86", binary: "C:\\legacy\\agent.exe" } }),
  F("binary-cpp", "key", "AES-256", 256, "detected", "binary", "0x0003e008", { metadata: { container: "ELF", arch: "aarch64", binary: "/opt/hsm/client" } }),
  F("binary-cpp", "library", "MD5", null, "detected", "binary", "0x0000f1c4", { metadata: { container: "Mach-O", arch: "arm64", binary: "/Applications/Sync.app" } }),
  F("binary-cpp", "library", "ECDH", 384, "inferred", "binary", "0x00077a00", { metadata: { container: "ELF", arch: "x86_64", binary: "/usr/local/bin/gateway" }, asset_key: "asset:gateway" }),
  F("binary-cpp", "library", "SHA-256", null, "detected", "binary", "0x00011ee0", { metadata: { container: "PE", arch: "x64", binary: "C:\\bin\\updater.exe" } }),
];
const network = [
  F("network-go", "certificate", "RSA", 2048, "detected", "network", "CN=api.example.bank", { target: "203.0.113.10:443", fingerprint: "sha256:aa90cc13b7", asset_key: "asset:payments-api", metadata: { tls_version: "TLS 1.2", cert_serial: "04:AF:19:77:2C:0E", ssh_banner: null } }),
  F("network-go", "protocol", "TLS 1.0", null, "detected", "network", "legacy-portal.example.bank:443", { target: "203.0.113.44:443", metadata: { tls_version: "TLS 1.0", cert_serial: "01:9B:F3:42:A1:10" } }),
  F("network-go", "certificate", "RSA", 1024, "detected", "network", "CN=old-vpn.example.bank", { target: "198.51.100.7:443", asset_key: "asset:old-vpn", metadata: { tls_version: "TLS 1.1", cert_serial: "7E:11:05:C3:90:2B" } }),
  F("network-go", "certificate", "ECDSA", 256, "detected", "network", "CN=portal.example.bank", { target: "203.0.113.20:443", fingerprint: "sha256:d3e1f09a41", metadata: { tls_version: "TLS 1.3", cert_serial: "3C:5D:00:E9:A8:76" } }),
  F("network-go", "protocol", "SSH (ssh-rsa)", 2048, "detected", "network", "OpenSSH_7.4", { target: "10.0.4.21:22", metadata: { ssh_banner: "SSH-2.0-OpenSSH_7.4", tls_version: null } }),
  F("network-go", "protocol", "TLS 1.3 + ML-KEM-768", null, "detected", "network", "pq.example.bank:443", { target: "203.0.113.90:443", metadata: { tls_version: "TLS 1.3", cert_serial: "AB:12:00:44:19:EE" } }),
  F("network-go", "certificate", "RSA", 3072, "detected", "network", "CN=api.example.bank", { target: "203.0.113.10:8443", asset_key: "asset:payments-api", metadata: { tls_version: "TLS 1.2", cert_serial: "04:AF:19:77:2C:0F" } }),
  F("network-go", "protocol", "SSH (ecdsa-sha2)", 256, "detected", "network", "OpenSSH_9.2", { target: "198.51.100.30:22", metadata: { ssh_banner: "SSH-2.0-OpenSSH_9.2" } }),
];
const cloud = [
  F("cloud-go", "key", "RSA", 2048, "enriched", "cloud", "arn:aws:kms:ap-south-1:111122223333:key/1a2b3c", { metadata: { provider: "AWS", key_state: "enabled", rotation: "enabled", region: "ap-south-1" }, asset_key: "asset:vault-svc" }),
  F("cloud-go", "key", "AES-256", 256, "enriched", "cloud", "arn:aws:kms:ap-south-1:111122223333:key/9f8e7d", { metadata: { provider: "AWS", key_state: "enabled", rotation: "enabled", region: "ap-south-1" } }),
  F("cloud-go", "key", "RSA", 4096, "enriched", "cloud", "https://kv-prod.vault.azure.net/keys/sign-key/ab12", { metadata: { provider: "Azure", key_state: "enabled", rotation: "disabled" } }),
  F("cloud-go", "key", "ECDSA", 256, "enriched", "cloud", "projects/acme/locations/global/keyRings/kr1/cryptoKeys/ec-sign", { metadata: { provider: "GCP", key_state: "disabled", rotation: "disabled" } }),
  F("cloud-go", "key", "AES-128", 128, "enriched", "cloud", "arn:aws:kms:us-east-1:111122223333:key/5d4c3b", { metadata: { provider: "AWS", key_state: "pending_deletion", rotation: "disabled", region: "us-east-1" } }),
  F("cloud-go", "key", "RSA", 2048, "detected", "cloud", "https://kv-dev.vault.azure.net/keys/test/ff09", { metadata: { provider: "Azure", key_state: "enabled", rotation: "enabled" } }),
];
const mainframe = [
  F("mainframe-java", "key", "3DES", 168, "detected", "mainframe", "PIN-ZONE-KEY-01", { metadata: { system_id: "MF-PROD-A1", context: "ATM PIN block encryption (ISO-0)" } }),
  F("mainframe-java", "key", "RSA", 2048, "detected", "mainframe", "SWIFT-SIGN-KEY", { metadata: { system_id: "MF-PROD-A1", context: "SWIFT message signing" } }),
  F("mainframe-java", "key", "AES-256", 256, "detected", "mainframe", "CARD-MK-AES", { metadata: { system_id: "MF-PROD-B2", context: "Card master key wrap" } }),
  F("mainframe-java", "library", "SHA-1", null, "detected", "mainframe", "COBOL-HASH-ROUTINE-7", { metadata: { system_id: "MF-PROD-B2", context: "Batch settlement checksum" } }),
  F("mainframe-java", "key", "DES", 56, "inferred", "mainframe", "LEGACY-MAC-KEY", { metadata: { system_id: "MF-DR-C1", context: "Legacy MAC for inter-bank files" } }),
];

export const SAMPLE_FINDINGS = [...code, ...binary, ...network, ...cloud, ...mainframe];

const dev = (device_id, device_type, model, vendor, vendor_country, origin, extra) => ({ device_id, device_type, model, vendor, vendor_country, origin, license: "Commercial", ...extra });
const ts = (d) => new Date(Date.now() - d * 3600e3).toISOString();

export const SAMPLE_QBOM = [
  dev("QPU-001", "qpu", "Eagle r3", "IBM Quantum", "US", "detected", { firmware_version: "4.2.1", software_version: "Qiskit 1.2", communication_protocol: "HTTPS/REST", attestation: { status: "verified", authority: "vendor-ca" }, metrics: { qubit_count: 127, measured_at: ts(2) },
    dependencies: [{ type: "hardware", name: "Dilution refrigerator control", version: "2.1" }, { type: "firmware", name: "Control firmware", version: "4.2.1" }, { type: "library", name: "qiskit", version: "1.2.0" }, { type: "service", name: "IBM Quantum Cloud API", version: "v2" }],
    vulnerabilities: [{ id: "CVE-2025-31104", severity: "MEDIUM", description: "Job API token not scoped per backend" }] }),
  dev("QPU-002", "qpu", "Tianyan-504", "China Telecom Quantum", "CN", "enriched", { firmware_version: "1.9.0", software_version: "Cqlib 0.4", communication_protocol: "gRPC", attestation: { status: "unverified" }, metrics: { qubit_count: 504, measured_at: ts(30) },
    dependencies: [{ type: "firmware", name: "Pulse sequencer", version: "1.9.0" }, { type: "library", name: "cqlib", version: "0.4.2" }],
    vulnerabilities: [{ id: "CVE-2025-77310", severity: "HIGH", description: "Unauthenticated telemetry endpoint" }, { id: "ADV-2025-018", severity: "LOW", description: "Verbose error messages" }] }),
  dev("SIM-001", "qpu_simulator", "Aer Statevector", "IBM Quantum", "US", "detected", { firmware_version: "—", software_version: "qiskit-aer 0.15", communication_protocol: "local", license: "Apache-2.0", attestation: { status: "none" }, metrics: { qubit_count: 32, measured_at: ts(5) }, dependencies: [{ type: "library", name: "numpy", version: "1.26" }], vulnerabilities: [] }),
  dev("QKD-001", "qkd", "Clavis XG", "ID Quantique", "CH", "detected", { firmware_version: "3.0.4", software_version: "QKD-Manager 5.1", communication_protocol: "ETSI GS QKD 014", attestation: { status: "verified", authority: "vendor-ca" }, metrics: { qber_percent: 2.8, key_rate_bps: 14200, measured_at: ts(1) },
    dependencies: [{ type: "hardware", name: "Single-photon detector", version: "SPD-4" }, { type: "firmware", name: "Alice/Bob firmware", version: "3.0.4" }, { type: "service", name: "Key Management Entity", version: "5.1" }], vulnerabilities: [] }),
  dev("QKD-002", "qkd", "QKD-Link 2", "QuantumCTek", "CN", "inferred", { firmware_version: "2.7.0", software_version: "QMS 3.2", communication_protocol: "ETSI GS QKD 004", attestation: { status: "unverified" }, metrics: { qber_percent: 7.9, key_rate_bps: 5100, measured_at: ts(3) },
    dependencies: [{ type: "firmware", name: "Link controller", version: "2.7.0" }], vulnerabilities: [{ id: "CVE-2025-40021", severity: "CRITICAL", description: "Hard-coded management credentials" }] }),
  dev("QKD-003", "qkd", "Cerberis 3", "ID Quantique", "CH", "detected", { firmware_version: "3.1.0", software_version: "QKD-Manager 5.1", communication_protocol: "ETSI GS QKD 014", attestation: { status: "verified" }, metrics: { qber_percent: 12.4, key_rate_bps: 800, measured_at: ts(6) }, dependencies: [], vulnerabilities: [] }),
  dev("QRNG-001", "qrng", "Quantis PCIe", "ID Quantique", "CH", "detected", { firmware_version: "1.4", software_version: "libquantis 2.0", communication_protocol: "PCIe", attestation: { status: "verified" }, metrics: { measured_at: ts(8) }, dependencies: [{ type: "library", name: "libquantis", version: "2.0" }], vulnerabilities: [] }),
  dev("QRNG-002", "qrng", "QRNG-USB", "Quside", "ES", "enriched", { firmware_version: "2.2", software_version: "quside-sdk 1.1", communication_protocol: "USB", attestation: { status: "none" }, metrics: { measured_at: ts(40) }, dependencies: [], vulnerabilities: [] }),
  dev("HSM-001", "pqc_hardware", "Luna 7 PQC", "Thales", "FR", "detected", { firmware_version: "7.9.1", software_version: "LunaClient 10.7", communication_protocol: "PKCS#11", attestation: { status: "verified", authority: "FIPS 140-3" }, metrics: { measured_at: ts(4) },
    dependencies: [{ type: "firmware", name: "Luna firmware", version: "7.9.1" }, { type: "library", name: "libCryptoki2", version: "10.7" }], vulnerabilities: [{ id: "CVE-2025-12009", severity: "LOW", description: "Admin CLI logs partial key labels" }] }),
  dev("HSM-002", "pqc_hardware", "CryptoServer CP5", "Utimaco", "DE", "detected", { firmware_version: "5.2.0", software_version: "CAL 6.0", communication_protocol: "PKCS#11", attestation: { status: "verified" }, metrics: { measured_at: ts(12) }, dependencies: [], vulnerabilities: [] }),
  dev("HSM-003", "pqc_hardware", "SafeNet PQ-1", "Entrust", "US", "inferred", { firmware_version: "—", software_version: "nShield 13", communication_protocol: "PKCS#11", attestation: { status: "none" }, metrics: { measured_at: ts(90) }, dependencies: [], vulnerabilities: [] }),
  dev("SDK-001", "sdk", "liboqs", "Open Quantum Safe", "CA", "detected", { firmware_version: "—", software_version: "0.12.0", communication_protocol: "library", license: "MIT", attestation: { status: "none" }, metrics: { measured_at: ts(20) }, dependencies: [{ type: "library", name: "OpenSSL", version: "3.3" }], vulnerabilities: [{ id: "GHSA-q9m2", severity: "MEDIUM", description: "Timing side channel in ML-KEM decapsulation (fixed in 0.12.1)" }] }),
  dev("QPU-003", "qpu", "Aquila", "QuEra", "US", "enriched", { firmware_version: "2.0", software_version: "Bloqade 0.20", communication_protocol: "HTTPS/REST", attestation: { status: "unverified" }, metrics: { qubit_count: 256, measured_at: ts(15) }, dependencies: [], vulnerabilities: [] }),
  dev("QPU-004", "qpu", "Aria-1", "IonQ", "US", "detected", { firmware_version: "6.1", software_version: "ionq-sdk 0.5", communication_protocol: "HTTPS/REST", attestation: { status: "verified" }, metrics: { qubit_count: 25, measured_at: ts(7) }, dependencies: [], vulnerabilities: [] }),
  dev("QKD-004", "qkd", "Quantum-Safe Link", "Toshiba", "JP", "detected", { firmware_version: "1.2", software_version: "QKD-Net 2.0", communication_protocol: "ETSI GS QKD 014", attestation: { status: "verified" }, metrics: { qber_percent: 4.1, key_rate_bps: 21000, measured_at: ts(2) }, dependencies: [], vulnerabilities: [] }),
].map((d) => ({ evidence: { reference_type: "device", value: d.device_id }, ...d }));

export const SAMPLE_META = {
  scan_timestamp: new Date(Date.now() - 3 * 3600e3).toISOString(),
  scanner_versions: { "code-python": "0.9.2", "binary-cpp": "0.8.0", "network-go": "1.1.3", "cloud-go": "1.0.1", "mainframe-java": "0.5.4", "quantum-python": "0.3.0" },
};
export const SAMPLE_HISTORY = [
  { at: "2026-06-01", critical: 17, high: 20, medium: 4, safe: 1 },
  { at: "2026-07-01", critical: 16, high: 19, medium: 4, safe: 3 },
  { at: "2026-08-01", critical: 14, high: 18, medium: 3, safe: 4 },
  { at: "2026-09-01", critical: 13, high: 17, medium: 3, safe: 6 },
  { at: "2026-10-01", critical: 12, high: 16, medium: 2, safe: 7 },
  { at: "2026-11-01", critical: 11, high: 15, medium: 2, safe: 8 },
];
