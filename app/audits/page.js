'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocalList } from '../../lib/useLocalList';
import { SEED_AUDITS, AUDIT_TYPES } from '../../lib/auditData';
import { AUDIT_TEAM, HISTORICAL_OBSERVATIONS } from '../../lib/mankindData';
import { generateWorkProgram } from '../../lib/workProgram';

function statusBadge(s) {
  if (s === 'Closed') return 'badge-green';
  if (s === 'Fieldwork') return 'badge-amber';
  if (s === 'Reporting') return 'badge-blue';
  return 'badge-gray';
}

export default function Audits() {
  const { items: audits, addItem } = useLocalList('audit_engagements_v2', SEED_AUDITS);
  const { items: histObs } = useLocalList('historical_observations_v2', HISTORICAL_OBSERVATIONS);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', auditTypeId: AUDIT_TYPES[0].id, quarter: 'Q4 2026', startDate: '', endDate: '', leadAuditor: AUDIT_TEAM[0].name, departments: '' });

  function submit() {
    if (!form.title.trim()) return;
    const id = `AUD-${Date.now()}`;
    addItem({
      id, ...form, departments: form.departments.split(',').map((d) => d.trim()).filter(Boolean),
      status: 'Scheduled', rulesApplied: [], execSummary: '', evidenceRows: [], observations: [],
      workProgram: generateWorkProgram(form.auditTypeId, histObs),
    });
    setForm({ title: '', auditTypeId: AUDIT_TYPES[0].id, quarter: 'Q4 2026', startDate: '', endDate: '', leadAuditor: AUDIT_TEAM[0].name, departments: '' });
    setShowForm(false);
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Audits</h1>
          <p>Schedule new engagements and manage active ones.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : '+ Schedule New Audit'}</button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: '18px 20px', marginBottom: 20 }}>
          <span className="field-label">Audit title</span>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Q4 2026 Procurement Audit" style={{ marginBottom: 12 }} />
          <div className="row-2">
            <div><span className="field-label">Audit type (from Audit Universe)</span>
              <select value={form.auditTypeId} onChange={(e) => setForm({ ...form, auditTypeId: e.target.value })}>
                {AUDIT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div><span className="field-label">Quarter</span>
              <select value={form.quarter} onChange={(e) => setForm({ ...form, quarter: e.target.value })}>
                <option>Q1 2026</option><option>Q2 2026</option><option>Q3 2026</option><option>Q4 2026</option><option>Q1 2027</option>
              </select>
            </div>
          </div>
          <div className="row-2">
            <div><span className="field-label">Start date</span><input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
            <div><span className="field-label">End date</span><input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
          </div>
          <div className="row-2">
            <div><span className="field-label">Lead auditor</span>
              <select value={form.leadAuditor} onChange={(e) => setForm({ ...form, leadAuditor: e.target.value })}>
                {AUDIT_TEAM.map((p) => <option key={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div><span className="field-label">Department(s) in scope</span><input value={form.departments} onChange={(e) => setForm({ ...form, departments: e.target.value })} placeholder="e.g. Sales, Marketing" /></div>
          </div>
          <button className="btn btn-primary" onClick={submit}>Schedule audit</button>
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Audit</th><th>Type</th><th>Period</th><th>Lead</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {audits.map((a) => (
                <tr key={a.id}>
                  <td className="cell-strong">{a.title}</td>
                  <td className="cell-dim">{AUDIT_TYPES.find((t) => t.id === a.auditTypeId)?.name}</td>
                  <td className="cell-dim">{a.quarter}</td>
                  <td className="cell-dim">{a.leadAuditor}</td>
                  <td><span className={`badge ${statusBadge(a.status)}`}>{a.status}</span></td>
                  <td><Link href={`/audits/${a.id}`} className="btn-sm">Open →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
