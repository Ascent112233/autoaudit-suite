'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalList } from '../../lib/useLocalList';
import { AUDIT_TYPES, SEED_AUDITS } from '../../lib/auditData';
import { rankAuditUniverse } from '../../lib/riskScoring';
import { generateWorkProgram } from '../../lib/workProgram';
import { HISTORICAL_OBSERVATIONS } from '../../lib/mankindData';

function tierBadge(t) {
  if (t === 'Critical') return 'badge-red';
  if (t === 'High') return 'badge-amber';
  if (t === 'Medium') return 'badge-blue';
  return 'badge-gray';
}

function AuditCard({ t, onOpen, onEdit }) {
  return (
    <div className="card" style={{ padding: '16px 18px', cursor: 'pointer' }} onClick={() => onOpen(t)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h3 style={{ fontSize: 13.5, fontWeight: 700 }}>{t.name}</h3>
        <button className="btn-sm" onClick={(e) => { e.stopPropagation(); onEdit(t); }}>Edit</button>
      </div>
      <div style={{ display: 'flex', gap: 6, margin: '6px 0 10px', flexWrap: 'wrap' }}>
        <span className="badge badge-blue">{t.category}</span>
        <span className="badge badge-gray">{t.businessUnit}</span>
        <span className="badge badge-gray">{t.location}</span>
        <span className={`badge ${tierBadge(t.risk.tier)}`}>Risk: {t.risk.tier} ({t.risk.score})</span>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 10 }}>{t.description}</p>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand)' }}>Start auditing →</span>
    </div>
  );
}

export default function AuditUniverse() {
  const router = useRouter();
  const { items, addItem, updateItem } = useLocalList('audit_universe_v2', AUDIT_TYPES);
  const { items: audits, addItem: addAudit } = useLocalList('audit_engagements_v2', SEED_AUDITS);
  const { items: histObs } = useLocalList('historical_observations_v2', HISTORICAL_OBSERVATIONS);
  const [groupBy, setGroupBy] = useState('none');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'Financial', description: '', frequency: 'Quarterly', inherentRisk: 3, lastAuditDate: '2025-01-01', unresolvedCritical: 0 });

  const ranked = rankAuditUniverse(items);
  const topThree = ranked.slice(0, 3);

  function openCreate() { setEditingId(null); setForm({ name: '', category: 'Financial', description: '', frequency: 'Quarterly', inherentRisk: 3, lastAuditDate: '2025-01-01', unresolvedCritical: 0 }); setShowForm(true); }
  function openEdit(t) { setEditingId(t.id); setForm(t); setShowForm(true); }
  function submit() {
    if (!form.name.trim()) return;
    if (editingId) updateItem(editingId, form);
    else addItem({ id: `AT-${Math.floor(10 + Math.random() * 90)}`, ...form, inherentRisk: Number(form.inherentRisk), unresolvedCritical: Number(form.unresolvedCritical) });
    setShowForm(false);
  }

  function startAuditing(type) {
    const existing = audits.find((a) => a.auditTypeId === type.id && a.status !== 'Closed');
    if (existing) { router.push(`/audits/${existing.id}`); return; }
    const id = `AUD-${Date.now()}`;
    const quarter = `Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()}`;
    addAudit({
      id, title: `${quarter} ${type.name}`, auditTypeId: type.id, quarter,
      startDate: new Date().toISOString().slice(0, 10), endDate: '', leadAuditor: 'R. Mehta',
      departments: [type.businessUnit], status: 'Fieldwork', rulesApplied: [], execSummary: '', evidenceRows: [], observations: [],
      workProgram: generateWorkProgram(type.id, histObs),
    });
    router.push(`/audits/${id}`);
  }

  return (
    <>
      <div className="page-head">
        <h1>Audit Universe</h1>
        <p>Click any audit type to jump directly into auditing. Cards are ranked by the AI risk-based planning score below.</p>
        <button className="btn btn-primary" style={{ marginTop: 10 }} onClick={openCreate}>+ Add Audit Type</button>
      </div>

      <div className="card" style={{ padding: '16px 18px', marginBottom: 20, borderColor: 'var(--brand)', background: 'var(--brand-bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)' }}>✦ AI Risk-Based Audit Plan</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 10 }}>
          Based on inherent risk, time since last audit, and unresolved critical findings, the AI recommends prioritizing these areas this cycle:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {topThree.map((t, idx) => (
            <div key={t.id} style={{ fontSize: 12, display: 'flex', gap: 8, alignItems: 'baseline' }}>
              <b>{idx + 1}. {t.name}</b>
              <span className={`badge ${tierBadge(t.risk.tier)}`}>{t.risk.tier} · {t.risk.score}</span>
              <span style={{ color: 'var(--text-dimmer)', fontSize: 11 }}>— {t.risk.drivers.join('; ')}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span className="field-label" style={{ margin: 0 }}>Scope by:</span>
        <div className="role-toggle">
          <button className={groupBy === 'none' ? 'active' : ''} onClick={() => setGroupBy('none')}>All</button>
          <button className={groupBy === 'businessUnit' ? 'active' : ''} onClick={() => setGroupBy('businessUnit')}>Business Unit</button>
          <button className={groupBy === 'category' ? 'active' : ''} onClick={() => setGroupBy('category')}>Process</button>
          <button className={groupBy === 'location' ? 'active' : ''} onClick={() => setGroupBy('location')}>Plant / Entity</button>
        </div>
      </div>

      {groupBy === 'none' ? (
        <div className="grid grid-3">
          {ranked.map((t) => <AuditCard key={t.id} t={t} onOpen={startAuditing} onEdit={openEdit} />)}
        </div>
      ) : (
        [...new Set(ranked.map((t) => t[groupBy]))].map((groupVal) => (
          <div key={groupVal} style={{ marginBottom: 22 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: 'var(--text-dim)' }}>{groupVal}</h3>
            <div className="grid grid-3">
              {ranked.filter((t) => t[groupBy] === groupVal).map((t) => <AuditCard key={t.id} t={t} onOpen={startAuditing} onEdit={openEdit} />)}
            </div>
          </div>
        ))
      )}

      {showForm && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="modal-card">
            <h2>{editingId ? 'Edit Audit Type' : 'New Audit Type'}</h2>
            <span className="field-label">Name</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ marginBottom: 12 }} />
            <div className="row-2">
              <div><span className="field-label">Category</span>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option>Financial</option><option>GxP / Field Sales</option><option>Quality</option><option>Quality / IT</option><option>Third-Party / Supply Chain</option><option>Clinical / GCP</option><option>Commercial Compliance</option><option>Operational</option>
                </select>
              </div>
              <div><span className="field-label">Frequency</span>
                <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
                  <option>Monthly</option><option>Quarterly</option><option>Semi-Annual</option><option>Annual</option>
                </select>
              </div>
            </div>
            <div className="row-2">
              <div><span className="field-label">Inherent risk (1-5)</span><input type="number" min="1" max="5" value={form.inherentRisk} onChange={(e) => setForm({ ...form, inherentRisk: e.target.value })} /></div>
              <div><span className="field-label">Last audited</span><input type="date" value={form.lastAuditDate} onChange={(e) => setForm({ ...form, lastAuditDate: e.target.value })} /></div>
            </div>
            <span className="field-label">Unresolved critical findings from last cycle</span>
            <input type="number" min="0" value={form.unresolvedCritical} onChange={(e) => setForm({ ...form, unresolvedCritical: e.target.value })} style={{ marginBottom: 12 }} />
            <span className="field-label">Description</span>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="modal-footer">
              <button className="btn-ghost btn" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submit}>{editingId ? 'Save' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
