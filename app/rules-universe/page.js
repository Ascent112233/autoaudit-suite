'use client';

import { useState } from 'react';
import { useLocalList } from '../../lib/useLocalList';
import { RULES, AUDIT_TYPES } from '../../lib/auditData';

function sevBadge(s) {
  if (s === 'Critical' || s === 'High') return 'badge-red';
  if (s === 'Medium') return 'badge-amber';
  return 'badge-gray';
}

export default function RulesUniverse() {
  const { items, addItem, updateItem } = useLocalList('audit_rules_universe_v2', RULES);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', auditTypeId: AUDIT_TYPES[0].id, category: 'Threshold', value: '', severity: 'Medium', description: '' });

  function openCreate() { setEditingId(null); setForm({ name: '', auditTypeId: AUDIT_TYPES[0].id, category: 'Threshold', value: '', severity: 'Medium', description: '' }); setShowForm(true); }
  function openEdit(r) { setEditingId(r.id); setForm(r); setShowForm(true); }
  function submit() {
    if (!form.name.trim()) return;
    if (editingId) updateItem(editingId, form);
    else addItem({ id: `R-${Math.floor(10 + Math.random() * 90)}`, field: 'amount', condition: 'custom', ...form });
    setShowForm(false);
  }

  return (
    <>
      <div className="page-head">
        <h1>Rules Universe</h1>
        <p>Compliance rules and thresholds the Audit Team defines once and reuses across engagements — this is what evidence gets assessed against.</p>
        <button className="btn btn-primary" style={{ marginTop: 10 }} onClick={openCreate}>+ Add Rule</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Rule</th><th>Applies To</th><th>Category</th><th>Threshold</th><th>Severity</th><th></th></tr></thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id}>
                  <td className="cell-strong">{r.name}<div className="cell-dim" style={{ fontSize: 10.5 }}>{r.description}</div></td>
                  <td className="cell-dim">{AUDIT_TYPES.find((t) => t.id === r.auditTypeId)?.name || 'All'}</td>
                  <td>{r.category}</td>
                  <td className="cell-dim">{r.value != null && r.value !== '' ? `₹${r.value}` : '—'}</td>
                  <td><span className={`badge ${sevBadge(r.severity)}`}>{r.severity}</span></td>
                  <td><button className="btn-sm" onClick={() => openEdit(r)}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="modal-card">
            <h2>{editingId ? 'Edit Rule' : 'New Rule'}</h2>
            <span className="field-label">Rule name</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ marginBottom: 12 }} />
            <div className="row-2">
              <div><span className="field-label">Applies to audit type</span>
                <select value={form.auditTypeId} onChange={(e) => setForm({ ...form, auditTypeId: e.target.value })}>
                  {AUDIT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div><span className="field-label">Category</span>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option>Threshold</option><option>Documentation</option><option>Approval</option><option>Control</option><option>Anomaly</option>
                </select>
              </div>
            </div>
            <div className="row-2">
              <div><span className="field-label">Threshold value (₹)</span><input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></div>
              <div><span className="field-label">Severity</span>
                <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                  <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
                </select>
              </div>
            </div>
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
