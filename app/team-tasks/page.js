'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocalList } from '../../lib/useLocalList';
import { SEED_AUDITS, AUDIT_TYPES } from '../../lib/auditData';
import { AUDIT_TEAM } from '../../lib/mankindData';
import { useIdentity } from '../../lib/identity';

function statusBadge(s) {
  if (s === 'CAE Approved') return 'badge-green';
  if (s === 'Review Stage') return 'badge-blue';
  if (s === 'In Progress') return 'badge-amber';
  return 'badge-gray';
}

export default function TeamTasks() {
  const { items: audits, updateItem } = useLocalList('audit_engagements_v2', SEED_AUDITS);
  const identity = useIdentity();
  const [person, setPerson] = useState(AUDIT_TEAM[0].name);

  useEffect(() => {
    if (identity.ready && identity.isAuditTeam) { setPerson(identity.name); return; }
    try { const p = window.localStorage.getItem('audit_team_persona'); if (p) setPerson(p); } catch (e) {}
  }, [identity.ready, identity.isAuditTeam, identity.name]);
  function setPersonAndSave(p) { setPerson(p); window.localStorage.setItem('audit_team_persona', p); }

  const myTasks = [];
  audits.forEach((audit) => {
    (audit.workProgram || []).forEach((wp) => {
      if (wp.assignedTo === person) myTasks.push({ ...wp, auditId: audit.id, auditTitle: audit.title });
    });
  });

  function setStatus(auditId, taskId, status) {
    updateItem(auditId, (a) => ({ workProgram: a.workProgram.map((w) => (w.id === taskId ? { ...w, status } : w)) }));
  }

  const counts = { 'Not Started': 0, 'In Progress': 0, 'Review Stage': 0, 'CAE Approved': 0 };
  myTasks.forEach((t) => { counts[t.status] = (counts[t.status] || 0) + 1; });

  return (
    <>
      <div className="page-head">
        <h1>Team Task Sheets</h1>
        <p>Every work-program task the Audit Team has assigned, organized by who it's assigned to — this is where AI-suggested and historical-recurring test steps actually land for each auditor.</p>
      </div>

      <div className="role-banner">
        <div>Viewing task sheet for:</div>
        <div className="role-toggle">
          {AUDIT_TEAM.map((m) => (
            <button key={m.name} className={person === m.name ? 'active' : ''} onClick={() => setPersonAndSave(m.name)}>{m.name}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="card stat"><div className="k">Not Started</div><div className="v">{counts['Not Started']}</div></div>
        <div className="card stat"><div className="k">In Progress</div><div className="v" style={{ color: 'var(--amber)' }}>{counts['In Progress']}</div></div>
        <div className="card stat"><div className="k">Review Stage</div><div className="v" style={{ color: 'var(--blue)' }}>{counts['Review Stage']}</div></div>
        <div className="card stat"><div className="k">CAE Approved</div><div className="v" style={{ color: 'var(--green)' }}>{counts['CAE Approved']}</div></div>
      </div>

      {myTasks.length === 0 ? (
        <div className="card" style={{ padding: 30, textAlign: 'center' }}>
          <p style={{ fontSize: 12.5, color: 'var(--text-dimmer)' }}>No tasks assigned to {person} yet — assign work-program items from any audit's Work Program tab.</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Task</th><th>Source</th><th>From Audit</th><th>Status</th></tr></thead>
              <tbody>
                {myTasks.map((t) => (
                  <tr key={t.id}>
                    <td className="cell-strong" style={{ maxWidth: 380 }}>{t.task}</td>
                    <td><span className={`badge ${t.source === 'Historical Recurring' ? 'badge-amber' : 'badge-teal'}`}>{t.source === 'Historical Recurring' ? '↻ Recurring' : '✦ AI Suggested'}</span></td>
                    <td className="cell-dim"><Link href={`/audits/${t.auditId}`} style={{ color: 'var(--brand)' }}>{AUDIT_TYPES.find((at) => at.id === audits.find((a) => a.id === t.auditId)?.auditTypeId)?.name || t.auditTitle}</Link></td>
                    <td>
                      <select value={t.status} onChange={(e) => setStatus(t.auditId, t.id, e.target.value)} style={{ width: 140, padding: '5px 8px', fontSize: 11 }}>
                        <option>Not Started</option><option>In Progress</option><option>Review Stage</option><option>CAE Approved</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
