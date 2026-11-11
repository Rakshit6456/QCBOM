"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useData } from "@/lib/store";
import { riskLevel } from "@/lib/analysis";
import { MODULES, SLUG_TO_MODULE } from "@/lib/constants";
import { fmtTime } from "./ui";
import { DashIcon, KeyIcon, ChipIcon, GlobeIcon, CloudIcon, CodeIcon, BinaryIcon, ServerIcon, ShieldIcon, FileIcon, UploadIcon, MoonIcon, SunIcon, BellIcon, ChevronLeftIcon } from "./Icons";

const NAV = [
  { heading: "Overview", items: [{ to: "/dashboard", label: "Dashboard", icon: <DashIcon /> }] },
  { heading: "Inventory", items: [{ to: "/findings", label: "CBOM Findings", icon: <KeyIcon />, count: true }, { to: "/qbom", label: "QBOM Inventory", icon: <ChipIcon /> }] },
  { heading: "Modules", items: [
    { to: "/modules/network", label: "Network", icon: <GlobeIcon /> }, { to: "/modules/cloud", label: "Cloud", icon: <CloudIcon /> },
    { to: "/modules/code", label: "Code", icon: <CodeIcon /> }, { to: "/modules/binary", label: "Binary", icon: <BinaryIcon /> },
    { to: "/modules/mainframe", label: "Mainframe", icon: <ServerIcon /> } ] },
  { heading: "Analysis", items: [{ to: "/risk", label: "Risk & Compliance", icon: <ShieldIcon /> }, { to: "/reports", label: "Reports", icon: <FileIcon /> }] },
  { heading: "System", items: [{ to: "/ingest", label: "Data Ingest", icon: <UploadIcon /> }] },
];

export default function Shell({ children }) {
  const path = usePathname();
  const router = useRouter();
  const { findings, qbom, meta, ready } = useData();
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState("light");
  const [bell, setBell] = useState(false);

  useEffect(() => {
    try { setCollapsed(localStorage.getItem("qcbom_sidebar") === "1"); } catch {}
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);
  useEffect(() => { setBell(false); }, [path]);

  const toggleSidebar = () => setCollapsed((c) => { try { localStorage.setItem("qcbom_sidebar", c ? "0" : "1"); } catch {} return !c; });
  const toggleTheme = () => {
    const t = theme === "dark" ? "light" : "dark";
    setTheme(t); document.documentElement.dataset.theme = t;
    try { localStorage.setItem("qcbom_theme", t); } catch {}
  };

  const TITLES = { "/dashboard": "Dashboard", "/findings": "CBOM Findings", "/qbom": "QBOM Inventory", "/risk": "Risk & Compliance", "/reports": "Reports", "/ingest": "Data Ingest" };
  const title = TITLES[path] || (path.startsWith("/modules/") ? (MODULES[SLUG_TO_MODULE[path.split("/")[2]]]?.label || "Module") + " scan" : "QCBOM");
  const critical = findings.filter((f) => riskLevel(f) === "critical");
  const versions = Object.entries(meta.scanner_versions || {});

  return (
    <div className={`app${collapsed ? " collapsed" : ""}`}>
      <aside className="sidebar">
        <button type="button" className="edge-toggle" onClick={toggleSidebar} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}><ChevronLeftIcon /></button>
        <Link className="brand" href="/dashboard" aria-label="QCBOM dashboard">
          <img src="/qnnx-mark.png" alt="" />
          <span className="logo-text">QN<span className="brand-accent">NX</span> QCBOM</span>
        </Link>
        <nav className="nav" aria-label="Main">
          {NAV.map((g) => (
            <div className="nav-group" key={g.heading}>
              <div className="nav-heading">{g.heading}</div>
              {g.items.map((n) => (
                <Link key={n.to} href={n.to} className="nav-item" title={n.label} aria-current={path === n.to || path.startsWith(n.to + "/") ? "page" : undefined}>
                  {n.icon}<span className="nav-label">{n.label}</span>
                  {n.count && critical.length > 0 && <span className="nav-count" aria-label={`${critical.length} critical`}>{critical.length}</span>}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-account">
          <div className="user-card">
            <span className="avatar" aria-hidden="true">SA</span>
            <span className="user-text"><span className="user-name">Security Analyst</span><span className="user-role">Analyst</span></span>
          </div>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <div className="topbar-title">
            <span className="view-title">{title}</span>
          </div>
          <div className="topbar-actions">
            <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle light / dark mode" title="Toggle light / dark mode">{theme === "dark" ? <SunIcon /> : <MoonIcon />}</button>
            <div className="notif-wrap">
              <button className="icon-btn" onClick={() => setBell((b) => !b)} aria-label="Critical findings" aria-expanded={bell}>
                <BellIcon />{critical.length > 0 && <span className="notif-badge">{critical.length}</span>}
              </button>
              {bell && (
                <div className="notif-dropdown">
                  <div className="notif-head">Critical findings</div>
                  {critical.slice(0, 5).map((f) => (
                    <button key={f.module + f.finding_id} className="notif-item" onClick={() => router.push(`/findings?open=${encodeURIComponent(f.module + "::" + f.finding_id)}`)}>
                      <b>{f.algorithm}{f.key_size ? `-${f.key_size}` : ""}</b><span className="muted mono">{f.evidence?.value}</span>
                    </button>
                  ))}
                  {critical.length === 0 && <div className="empty">No critical findings</div>}
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="scanbar" role="status">
          <span className="sb-stat">Last scan <b>{ready ? fmtTime(meta.scan_timestamp) : "…"}</b></span>
          <span className="sb-stat">Findings <b>{findings.length}</b></span>
          <span className="sb-stat">QBOM devices <b>{qbom.length}</b></span>
          {/* Scanner versions (req 7.5) are hidden for now. To restore, add back inside this bar:
              <span className="sb-vers">{versions.map(([m, v]) => <span key={m} className="sb-pill"><b>{MODULES[m]?.label || m}</b><span>v{v}</span></span>)}</span>
          */}
        </div>
        <main className="page">{children}</main>
      </div>
    </div>
  );
}
