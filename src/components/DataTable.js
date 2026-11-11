"use client";
import { useMemo, useState } from "react";
import { ChevronUpIcon, ChevronDownIcon } from "./Icons";

/** columns: [{ key, label, render?(row), sort?(row) }] */
export default function DataTable({ columns, rows, onRowClick, selectedId, rowId, pageSize = 25, empty }) {
  const [sort, setSort] = useState(null);
  const [page, setPage] = useState(0);
  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    const g = col.sort || ((r) => r[col.key]);
    return [...rows].sort((a, b) => {
      const x = g(a), y = g(b);
      if (x == null && y == null) return 0; if (x == null) return 1; if (y == null) return -1;
      return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), undefined, { numeric: true })) * sort.dir;
    });
  }, [rows, sort, columns]);
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const cur = Math.min(page, pages - 1);
  const slice = sorted.slice(cur * pageSize, cur * pageSize + pageSize);
  const toggle = (k) => setSort((s) => (s?.key === k ? (s.dir === 1 ? { key: k, dir: -1 } : null) : { key: k, dir: 1 }));

  if (!rows.length) return <div className="table-wrap">{empty}</div>;
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{columns.map((c) => (
          <th key={c.key} aria-sort={sort?.key === c.key ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
            <button onClick={() => toggle(c.key)}>{c.label}<span className="sort-ico" aria-hidden="true">{sort?.key === c.key ? (sort.dir === 1 ? <ChevronUpIcon /> : <ChevronDownIcon />) : null}</span></button>
          </th>))}</tr></thead>
        <tbody>
          {slice.map((r, i) => {
            const id = rowId ? rowId(r) : i;
            return (
              <tr key={id} className={onRowClick ? "click" : ""} tabIndex={onRowClick ? 0 : undefined} aria-selected={selectedId === id}
                onClick={() => onRowClick?.(r)} onKeyDown={(e) => { if (onRowClick && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onRowClick(r); } }}>
                {columns.map((c) => <td key={c.key} className={c.wrap ? "wrap" : ""}>{c.render ? c.render(r) : r[c.key] ?? "—"}</td>)}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="pager">
        <span>{sorted.length} row{sorted.length === 1 ? "" : "s"}</span>
        {pages > 1 && <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btn btn-sm" disabled={cur === 0} onClick={() => setPage(cur - 1)}>Prev</button>
          Page {cur + 1} / {pages}
          <button className="btn btn-sm" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>Next</button>
        </span>}
      </div>
    </div>
  );
}
