'use client';

import Link from 'next/link';
import { useLocalList } from '../lib/useLocalList';
import { SEED_AUDITS, AUDIT_TYPES } from '../lib/auditData';
import { AUDIT_ARCHIVE, TRAVEL_LOG } from '../lib/mankindData';
import { formatInrCompact } from '../lib/format';

export default function Home() {
  const { items: audits } = useLocalList('audit_engagements_v2', SEED_AUDITS);
  const { items: archive } = useLocalList('audit_archive_v2', AUDIT_ARCHIVE);

  const allObs = audits.flatMap((a) => a.observations);
  const pending = allObs.filter((o) => o.status === 'Pending').length;
  const assigned = allObs.filter((o) => o.status === 'Assigned').length;
  const resolved = allObs.filter((o) => o.status === 'Resolved').length;

  // Executive KPI bar — the numbers a Head of Audit actually opens this platform to see.
  const totalAuditsExecuted = archive.length + audits.filter((a) => a.status === 'Closed').length;
  const openCriticalIssues = allObs.filter((o) => o.severity === 'Critical' && !['Resolved', 'Rejected'].includes(o.status)).length;
  const financialLeakage = allObs.reduce((sum, o) => sum + (Number(o.financialImpactInr) || 0), 0);
  const travelDefaulters = TRAVEL_LOG.filter((r) => Math.round(((r.claimedKm - r.gpsKm) / r.gpsKm) * 100) > 20).length;
  const closedCount = audits.filter((a) => a.status === 'Closed').length;
  const planCompletionPct = audits.length ? Math.round((closedCount / audits.length) * 100) : 0;

  return (
    <>
      <div className="page-head">
        <h1>Internal Audit Program</h1>
        <p>Plan, execute, and report on audits — with AI-assisted evidence assessment and department-head remediation tracking.</p>
      </div>

      <div className="kpi-bar">
        <div className="card kpi-card"><div className="k">Total Audits Executed</div><div className="v">{totalAuditsExecuted}</div></div>
        <div className="card kpi-card"><div className="k">Open Critical Issues</div><div className="v">{openCriticalIssues}</div></div>
        <div className="card kpi-card"><div className="k">Financial Leakage Identified</div><div className="v">{formatInrCompact(financialLeakage)}</div></div>
        <div className="card kpi-card"><div className="k">High-Risk Travel Defaulters</div><div className="v">{travelDefaulters}</div></div>
        <div className="card kpi-card"><div className="k">Plan Completion</div><div className="v">{planCompletionPct}%</div></div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 22 }}>
        <div className="card stat"><div className="k">Active Audits</div><div className="v">{audits.filter((a) => a.status !== 'Closed').length}</div></div>
        <div className="card stat"><div className="k">Pending Observations</div><div className="v" style={{ color: 'var(--amber)' }}>{pending}</div></div>
        <div className="card stat"><div className="k">Assigned to Dept. Heads</div><div className="v" style={{ color: 'var(--blue)' }}>{assigned}</div></div>
        <div className="card stat"><div className="k">Resolved</div><div className="v" style={{ color: 'var(--green)' }}>{resolved}</div></div>
      </div>

      <div className="page-head" style={{ marginBottom: 12 }}><h1 style={{ fontSize: 15 }}>Quick access</h1></div>
      <div className="grid grid-3" style={{ marginBottom: 22 }}>
        <Link href="/audit-universe" className="card stat"><div className="k">Audit Universe</div><div className="d" style={{ marginTop: 6 }}>{AUDIT_TYPES.length} audit types defined →</div></Link>
        <Link href="/rules-universe" className="card stat"><div className="k">Rules Universe</div><div className="d" style={{ marginTop: 6 }}>Configure compliance thresholds →</div></Link>
        <Link href="/vendor-master" className="card stat"><div className="k">Vendor Master</div><div className="d" style={{ marginTop: 6 }}>Browse vendors, flag duplicates →</div></Link>
        <Link href="/difference-tracker" className="card stat"><div className="k">Difference Tracker</div><div className="d" style={{ marginTop: 6 }}>Claimed vs GPS distance reconciliation →</div></Link>
        <Link href="/audits" className="card stat"><div className="k">Schedule an Audit</div><div className="d" style={{ marginTop: 6 }}>Start a new engagement →</div></Link>
        <Link href="/audit-archive" className="card stat"><div className="k">Audit Archive</div><div className="d" style={{ marginTop: 6 }}>{archive.length} past audits on record →</div></Link>
      </div>

      <div className="page-head" style={{ marginBottom: 12 }}><h1 style={{ fontSize: 15 }}>Current engagements</h1></div>
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
                  <td><span className="badge badge-purple">{a.status}</span></td>
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
