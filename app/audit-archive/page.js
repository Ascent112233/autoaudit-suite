'use client';

import { useState } from 'react';
import { useLocalList } from '../../lib/useLocalList';
import { AUDIT_ARCHIVE } from '../../lib/mankindData';

function mapBadge(s) {
  return s === 'Closed' ? 'badge-green' : 'badge-amber';
}

export default function AuditArchive() {
  const { items: archive } = useLocalList('audit_archive_v2', AUDIT_ARCHIVE);
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('All');
  const [selected, setSelected] = useState(null);

  const years = ['All', ...new Set(archive.map((a) => a.year))].sort().reverse();
  const filtered = archive.filter((a) => {
    const matchesSearch = !search || a.scope.toLowerCase().includes(search.toLowerCase()) || a.entity.toLowerCase().includes(search.toLowerCase()) || a.leadAuditor.toLowerCase().includes(search.toLowerCase());
    const matchesYear = yearFilter === 'All' || a.year === Number(yearFilter);
    return matchesSearch && matchesYear;
  });

  return (
    <>
      <div className="page-head">
        <h1>Audit Archive</h1>
        <p>The permanent institutional record of every audit conducted across plants, business units, and corporate functions — independent of the current year's live engagements.</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by scope, entity, or lead auditor…" style={{ flex: 1 }} />
        <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} style={{ width: 140 }}>
          {years.map((y) => <option key={y} value={y}>{y === 'All' ? 'All years' : y}</option>)}
        </select>
      </div>

      <div className="grid grid-3" style={{ alignItems: 'flex-start' }}>
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Year</th><th>Scope</th><th>Entity</th><th>Lead Auditor</th><th>Observations</th><th>Critical</th><th>MAP Status</th></tr></thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} onClick={() => setSelected(a)} style={{ cursor: 'pointer', background: selected?.id === a.id ? 'var(--surface-2)' : undefined }}>
                    <td className="cell-dim">{a.id}</td>
                    <td>{a.year}</td>
                    <td className="cell-strong">{a.scope}</td>
                    <td className="cell-dim">{a.entity}</td>
                    <td className="cell-dim">{a.leadAuditor}</td>
                    <td className="cell-dim">{a.totalObservations}</td>
                    <td>{a.criticalFlags > 0 ? <span className="badge badge-red">{a.criticalFlags}</span> : <span className="cell-dim">0</span>}</td>
                    <td><span className={`badge ${mapBadge(a.mapStatus)}`}>{a.mapStatus}</span></td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={8} className="cell-dim" style={{ textAlign: 'center', padding: 20 }}>No archived audits match this filter.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ padding: '16px 18px' }}>
          {!selected ? (
            <p style={{ fontSize: 12, color: 'var(--text-dimmer)' }}>Select a row to see its summary.</p>
          ) : (
            <>
              <h3 style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 4 }}>{selected.scope}</h3>
              <p className="cell-dim" style={{ fontSize: 11.5, marginBottom: 12 }}>{selected.entity} • {selected.year}</p>
              <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div><b>Lead Auditor:</b> {selected.leadAuditor}</div>
                <div><b>Total Observations:</b> {selected.totalObservations}</div>
                <div><b>Critical Flags:</b> {selected.criticalFlags}</div>
                <div><b>MAP Status:</b> {selected.mapStatus}</div>
                <div><b>Repeat Finding:</b> {selected.repeatFinding ? 'Yes — flagged as recurring' : 'No'}</div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
