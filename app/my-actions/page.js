'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocalList } from '../../lib/useLocalList';
import { SEED_AUDITS, DEPARTMENT_HEADS } from '../../lib/auditData';
import { useIdentity } from '../../lib/identity';

function sevBadge(s) {
  if (s === 'Critical' || s === 'High') return 'badge-red';
  if (s === 'Medium') return 'badge-amber';
  return 'badge-gray';
}

export default function MyActions() {
  const { items: audits, updateItem } = useLocalList('audit_engagements_v2', SEED_AUDITS);
  const identity = useIdentity();
  const [persona, setPersona] = useState(DEPARTMENT_HEADS[0].name);
  const [draftEvidence, setDraftEvidence] = useState({});

  useEffect(() => {
    if (identity.ready && identity.isDeptHead) { setPersona(identity.name); return; }
    try { const p = window.localStorage.getItem('audit_dh_persona'); if (p) setPersona(p); } catch (e) {}
  }, [identity.ready, identity.isDeptHead, identity.name]);
  function setPersonaAndSave(p) { setPersona(p); window.localStorage.setItem('audit_dh_persona', p); }

  const myItems = [];
  audits.forEach((audit) => {
    audit.observations.forEach((o) => {
      if (o.assignedTo === persona && (o.status === 'Assigned' || o.status === 'Submitted for Review' || o.status === 'Resolved')) {
        myItems.push({ ...o, auditId: audit.id, auditTitle: audit.title });
      }
    });
  });

  function submitEvidence(auditId, obsId) {
    const text = draftEvidence[obsId];
    if (!text || !text.trim()) return;
    updateItem(auditId, (a) => ({
      observations: a.observations.map((o) => (o.id === obsId ? { ...o, complianceEvidence: text, status: 'Submitted for Review' } : o)),
    }));
    setDraftEvidence({ ...draftEvidence, [obsId]: '' });
  }

  return (
    <>
      <div className="page-head">
        <h1>My Assigned Items</h1>
        <p>Non-compliant observations assigned to you by the Audit Team. Attach evidence proving compliance to close them out.</p>
      </div>

      <div className="role-banner">
        <div>Viewing as (demo persona switcher):</div>
        <div className="role-toggle">
          {DEPARTMENT_HEADS.map((p) => (
            <button key={p.name} className={persona === p.name ? 'active' : ''} onClick={() => setPersonaAndSave(p.name)}>{p.name}</button>
          ))}
        </div>
      </div>

      {myItems.length === 0 ? (
        <div className="card" style={{ padding: 30, textAlign: 'center' }}>
          <p style={{ fontSize: 12.5, color: 'var(--text-dimmer)' }}>No items assigned to {persona} right now.</p>
        </div>
      ) : (
        myItems.map((o) => (
          <div className="card" style={{ padding: '16px 18px', marginBottom: 14 }} key={o.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{o.type}</div>
                <div className="cell-dim" style={{ fontSize: 11 }}>
                  From <Link href={`/audits/${o.auditId}`} style={{ color: 'var(--brand)' }}>{o.auditTitle}</Link>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <span className={`badge ${sevBadge(o.severity)}`}>{o.severity}</span>
                <span className={`badge ${o.status === 'Resolved' ? 'badge-green' : o.status === 'Submitted for Review' ? 'badge-blue' : 'badge-amber'}`}>{o.status}</span>
              </div>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 12 }}>{o.detail}</p>

            {o.status === 'Assigned' && (
              <>
                <span className="field-label">Evidence of compliance</span>
                <textarea
                  value={draftEvidence[o.id] ?? ''}
                  onChange={(e) => setDraftEvidence({ ...draftEvidence, [o.id]: e.target.value })}
                  placeholder="Describe or attach evidence showing this is now compliant with the threshold/rule (e.g. approval email, corrected receipt)…"
                  style={{ marginBottom: 10 }}
                />
                <button className="btn btn-primary" onClick={() => submitEvidence(o.auditId, o.id)}>Submit for Review</button>
              </>
            )}
            {o.status === 'Submitted for Review' && (
              <p style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--text-dim)' }}>Submitted evidence: {o.complianceEvidence} — awaiting Audit Team verification.</p>
            )}
            {o.status === 'Resolved' && (
              <p style={{ fontSize: 12, color: 'var(--green)' }}>✓ Verified and resolved by {o.verifiedBy}.</p>
            )}
          </div>
        ))
      )}
    </>
  );
}
