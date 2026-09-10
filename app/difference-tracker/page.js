'use client';

import { useState } from 'react';
import { useLocalList } from '../../lib/useLocalList';
import { SEED_AUDITS, AUDIT_TYPES } from '../../lib/auditData';
import { TRAVEL_LOG } from '../../lib/mankindData';

function variancePct(r) { return Math.round(((r.claimedKm - r.gpsKm) / r.gpsKm) * 100); }
function barColor(pct) {
  if (pct >= 30) return 'var(--red)';
  if (pct >= 15) return 'var(--amber)';
  return 'var(--teal)';
}

export default function DifferenceTracker() {
  const { items: audits, updateItem } = useLocalList('audit_engagements_v2', SEED_AUDITS);
  const [flagged, setFlagged] = useState({});

  const travelAudit = audits.find((a) => a.auditTypeId === 'AT-07' && a.status !== 'Closed');
  const ranked = [...TRAVEL_LOG].sort((a, b) => variancePct(b) - variancePct(a));
  const maxVariance = Math.max(...ranked.map((r) => variancePct(r)), 1);

  function flagAsObservation(rep) {
    if (!travelAudit) return;
    const pct = variancePct(rep);
    const obs = {
      id: `OBS-${Date.now()}`,
      evidenceId: null, ruleId: null,
      type: 'GPS vs claimed distance variance',
      severity: pct >= 30 ? 'High' : 'Medium',
      detail: `${rep.repName} (${rep.region}) claimed ${rep.claimedKm} km vs GPS-tracked ${rep.gpsKm} km — a ${pct}% variance, ₹${rep.claimAmountInr.toLocaleString('en-IN')} claimed.`,
      financialImpactInr: rep.claimAmountInr,
      source: 'Manual', status: 'Pending', assignedTo: null, complianceEvidence: '', verifiedBy: '', rootCause: '', rootCauseCategory: '', capaDraft: '',
    };
    updateItem(travelAudit.id, (a) => ({ observations: [obs, ...a.observations] }));
    setFlagged({ ...flagged, [rep.repName]: true });
  }

  return (
    <>
      <div className="page-head">
        <h1>Difference Tracker</h1>
        <p>Visual side-by-side reconciliation — claimed distance vs GPS-tracked distance for Field Force travel claims this cycle.</p>
      </div>

      {!travelAudit && (
        <div className="card" style={{ padding: '14px 16px', marginBottom: 16, background: 'var(--amber-bg)' }}>
          <p style={{ fontSize: 12, color: 'var(--amber)' }}>No open Field Force Travel & Sales Expense audit found — start one from Audit Universe to enable "Flag as Observation" below.</p>
        </div>
      )}

      <div className="card">
        <div style={{ padding: '14px 18px 4px', display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr 90px', gap: 10, fontSize: 10.5, color: 'var(--text-dimmer)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          <div>Rep / Region</div><div>Claimed vs GPS (km)</div><div>Variance</div><div>Claim Amount</div><div></div>
        </div>
        {ranked.map((r) => {
          const pct = variancePct(r);
          return (
            <div className="diff-row" key={r.repName}>
              <div>
                <b>{r.repName}</b>
                <div className="cell-dim" style={{ fontSize: 11 }}>{r.region} • {r.dateRange}{r.flaggedLeaveOverlap ? ' • ⚠ leave overlap' : ''}</div>
              </div>
              <div>
                <div style={{ fontSize: 11.5 }}>{r.claimedKm} km claimed vs {r.gpsKm} km GPS</div>
                <div className="diff-bar-wrap"><div className="diff-bar" style={{ width: `${Math.min(100, (pct / maxVariance) * 100)}%`, background: barColor(pct) }} /></div>
              </div>
              <div style={{ fontWeight: 700, color: barColor(pct) }}>{pct}%</div>
              <div className="cell-dim">₹{r.claimAmountInr.toLocaleString('en-IN')}</div>
              <div>
                <button className="btn-sm" disabled={!travelAudit || flagged[r.repName]} onClick={() => flagAsObservation(r)}>
                  {flagged[r.repName] ? '✓ Flagged' : 'Flag'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
