'use client';

import { useState } from 'react';
import { VENDOR_MASTER } from '../../lib/mankindData';

export default function VendorMaster() {
  const [search, setSearch] = useState('');

  const gstinCounts = {};
  VENDOR_MASTER.forEach((v) => { gstinCounts[v.gstin] = (gstinCounts[v.gstin] || 0) + 1; });

  const filtered = VENDOR_MASTER.filter((v) =>
    !search ||
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.material.toLowerCase().includes(search.toLowerCase()) ||
    v.location.toLowerCase().includes(search.toLowerCase())
  );

  const duplicateCount = Object.values(gstinCounts).filter((c) => c > 1).length;
  const singleSourceCount = VENDOR_MASTER.filter((v) => v.singleSource).length;

  return (
    <>
      <div className="page-head">
        <h1>Vendor Master</h1>
        <p>Browse the active vendor master with duplicate-GSTIN and single-source exposure flagged automatically.</p>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 18 }}>
        <div className="card stat"><div className="k">Total Vendor Records</div><div className="v">{VENDOR_MASTER.length}</div></div>
        <div className="card stat"><div className="k">Duplicate GSTINs</div><div className="v" style={{ color: 'var(--red)' }}>{duplicateCount}</div></div>
        <div className="card stat"><div className="k">Single-Source Exposure</div><div className="v" style={{ color: 'var(--amber)' }}>{singleSourceCount}</div></div>
      </div>

      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by vendor name, material, or plant…" style={{ marginBottom: 16 }} />

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Vendor</th><th>Material</th><th>GSTIN</th><th>PAN</th><th>Plant / Location</th><th>Flags</th></tr></thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id}>
                  <td className="cell-strong">{v.name}</td>
                  <td>{v.material}</td>
                  <td className="cell-dim">{v.gstin}</td>
                  <td className="cell-dim">{v.pan}</td>
                  <td className="cell-dim">{v.location}</td>
                  <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {gstinCounts[v.gstin] > 1 && <span className="badge badge-red">Duplicate GSTIN</span>}
                    {v.singleSource && <span className="badge badge-amber">Single-Source</span>}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="cell-dim" style={{ textAlign: 'center', padding: 20 }}>No vendors match this search.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
