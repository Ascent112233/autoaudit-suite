'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocalList } from '../../../lib/useLocalList';
import { SEED_AUDITS, AUDIT_TYPES, RULES, DEPARTMENT_HEADS } from '../../../lib/auditData';
import { AUDIT_TEAM, HISTORICAL_OBSERVATIONS, AUDIT_ARCHIVE } from '../../../lib/mankindData';
import { useIdentity } from '../../../lib/identity';
import { generateWorkProgram } from '../../../lib/workProgram';
import { buildArchiveEntry, buildHistoricalEntries, countOpenCritical } from '../../../lib/closeAudit';
import { SAMPLE_CSV, parseCsv } from '../../../lib/csv';
import { assessEvidence, assessSingleRow } from '../../../lib/assessment';
import { downloadAuditReport } from '../../../lib/excelReport';
import { suggestRootCauseAndCapa, ROOT_CAUSE_CATEGORIES } from '../../../lib/capaSuggestion';

const TABS = ['Overview', 'Work Program', 'Evidence', 'Rules Applied', 'AI Assessment', 'Observations', 'Report'];
const CATEGORIES_BY_TYPE = {
  'AT-01': ['Sample Distribution', 'Sample Storage'],
  'AT-06': ['Speaker Program', 'Advisory Board', 'Promotional Material'],
  'AT-07': ['Airfare', 'Hotel', 'Meals', 'Ground Transport', 'Client Entertainment', 'Other'],
  'AT-08': ['Purchase Order', 'Contract', 'Invoice'],
};
const DEFAULT_CATEGORIES = ['General', 'Other'];

function statusBadge(s) {
  if (s === 'Resolved') return 'badge-green';
  if (s === 'Rejected') return 'badge-gray';
  if (s === 'Assigned' || s === 'Submitted for Review') return 'badge-blue';
  return 'badge-amber';
}
function sevBadge(s) {
  if (s === 'Critical' || s === 'High') return 'badge-red';
  if (s === 'Medium') return 'badge-amber';
  return 'badge-gray';
}

export default function AuditDetail() {
  const params = useParams();
  const router = useRouter();
  const { items: audits, updateItem } = useLocalList('audit_engagements_v2', SEED_AUDITS);
  const { items: rulesUniverse } = useLocalList('audit_rules_universe_v2', RULES);
  const { addItem: addArchiveEntry } = useLocalList('audit_archive_v2', AUDIT_ARCHIVE);
  const { items: histObs, addItem: addHistObs } = useLocalList('historical_observations_v2', HISTORICAL_OBSERVATIONS);
  const { items: universeTypes, updateItem: updateUniverseType } = useLocalList('audit_universe_v2', AUDIT_TYPES);
  const audit = audits.find((a) => a.id === params.id);

  const [tab, setTab] = useState('Overview');
  const { name: identityName, title: identityTitle, isAuditTeam } = useIdentity();
  const fileInput = useRef(null);
  const [running, setRunning] = useState(false);
  const [showManualObs, setShowManualObs] = useState(false);
  const [manualObs, setManualObs] = useState({ evidenceId: '', type: '', severity: 'Medium', detail: '', financialImpactInr: '' });
  const [assigningId, setAssigningId] = useState(null);
  const [editingObsId, setEditingObsId] = useState(null);
  const [editDraft, setEditDraft] = useState({ type: '', severity: 'Medium', detail: '', financialImpactInr: 0 });
  const [assignTo, setAssignTo] = useState(DEPARTMENT_HEADS[0].name);
  const [capaDraft, setCapaDraft] = useState({ rootCause: '', rootCauseCategory: 'System Gap', capaDraft: '', financialImpactInr: 0 });
  const [quickForm, setQuickForm] = useState({ employee: '', category: '', vendor: '', amount: '', date: '', receiptAttached: false });
  const [quickResult, setQuickResult] = useState(null);
  const [quickRunning, setQuickRunning] = useState(false);
  const [showQuick, setShowQuick] = useState(false);
  const [execSummaryDraft, setExecSummaryDraft] = useState('');
  const [generatingSummary, setGeneratingSummary] = useState(false);

  useEffect(() => {
    if (audit?.execSummary) setExecSummaryDraft(audit.execSummary);
  }, [audit?.id]);

  if (!audit) {
    return (
      <div className="card" style={{ padding: 30, textAlign: 'center' }}>
        <p style={{ color: 'var(--text-dim)', marginBottom: 14 }}>Audit {params.id} not found.</p>
        <button className="btn btn-ghost" onClick={() => router.push('/audits')}>← Back to Audits</button>
      </div>
    );
  }

  const auditType = AUDIT_TYPES.find((t) => t.id === audit.auditTypeId);
  const applicableRules = rulesUniverse.filter((r) => r.auditTypeId === audit.auditTypeId);
  const appliedRuleObjs = applicableRules.filter((r) => (audit.rulesApplied || []).includes(r.id));
  const categories = CATEGORIES_BY_TYPE[audit.auditTypeId] || DEFAULT_CATEGORIES;

  function closeAudit() {
    const entry = buildArchiveEntry(audit, auditType);
    addArchiveEntry(entry);
    buildHistoricalEntries(audit).forEach((h) => addHistObs(h));
    const uType = universeTypes.find((u) => u.id === audit.auditTypeId);
    if (uType) {
      updateUniverseType(uType.id, { lastAuditDate: new Date().toISOString().slice(0, 10), unresolvedCritical: countOpenCritical(audit) });
    }
    updateItem(audit.id, { status: 'Closed' });
  }

  function generateExecSummary() {
    setGeneratingSummary(true);
    setTimeout(() => {
      const bySeverity = { Critical: 0, High: 0, Medium: 0, Low: 0 };
      audit.observations.forEach((o) => { bySeverity[o.severity] = (bySeverity[o.severity] || 0) + 1; });
      const ruleNames = [...new Set(audit.observations.map((o) => o.type))];
      const themeLine = ruleNames.length ? `Recurring themes included ${ruleNames.slice(0, 3).join(', ')}${ruleNames.length > 3 ? ', among others' : ''}.` : '';
      const overallRisk = bySeverity.Critical > 0 ? 'elevated' : bySeverity.High > 0 ? 'moderate' : 'low';
      const resolvedCount = audit.observations.filter((o) => o.status === 'Resolved').length;
      const openCount = audit.observations.length - resolvedCount;
      const summary = `This ${auditType?.name} covered ${audit.evidenceRows.length} evidence item(s) across ${audit.departments.join(', ') || 'the scoped area'} for the period ${audit.startDate} to ${audit.endDate || 'present'}. The review identified ${audit.observations.length} observation(s): ${bySeverity.Critical} Critical, ${bySeverity.High} High, ${bySeverity.Medium} Medium, and ${bySeverity.Low} Low severity. ${themeLine} As of this report, ${resolvedCount} observation(s) have been resolved and verified, with ${openCount} still open for remediation. Based on the severity and volume of findings, overall risk exposure in this area is assessed as ${overallRisk}. ${bySeverity.Critical > 0 ? 'Critical findings should be prioritized for department-head remediation and re-verified before the next audit cycle.' : 'No critical findings were identified in this cycle.'}`;
      setExecSummaryDraft(summary);
      updateItem(audit.id, { execSummary: summary });
      setGeneratingSummary(false);
    }, 1200);
  }

  function runQuickOcr() {
    if (!quickForm.employee.trim() || !quickForm.vendor.trim() || !quickForm.amount || !quickForm.date) return;
    setQuickRunning(true);
    setTimeout(() => {
      const draft = { ...quickForm, amount: Number(quickForm.amount), receiptAttached: quickForm.receiptAttached ? 'Yes' : 'No' };
      const result = assessSingleRow(draft, audit.evidenceRows, appliedRuleObjs);
      setQuickResult(result);
      setQuickRunning(false);
    }, 900);
  }
  function confirmQuickSubmit() {
    const id = `EV-${Date.now()}`;
    const row = { id, ...quickForm, amount: Number(quickForm.amount), receiptAttached: quickForm.receiptAttached ? 'Yes' : 'No', ocrAmount: quickResult.ocrAmount, ocrConfidence: quickResult.ocrConfidence };
    const newObs = quickResult.observations.map((o, idx) => ({ id: `OBS-${Date.now()}-${idx}`, evidenceId: id, ruleId: o.ruleId || null, type: o.type, severity: o.severity, detail: o.detail, source: 'AI', status: 'Pending', assignedTo: null, complianceEvidence: '', verifiedBy: '' }));
    updateItem(audit.id, (a) => ({ evidenceRows: [...a.evidenceRows, row], observations: [...newObs, ...a.observations] }));
    setQuickForm({ employee: '', category: categories[0], vendor: '', amount: '', date: '', receiptAttached: false });
    setQuickResult(null);
    setShowQuick(false);
  }

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rows = parseCsv(ev.target.result);
      updateItem(audit.id, (a) => ({ evidenceRows: [...a.evidenceRows, ...rows] }));
    };
    reader.readAsText(file);
  }
  function loadSample() {
    const rows = parseCsv(SAMPLE_CSV);
    updateItem(audit.id, (a) => ({ evidenceRows: [...a.evidenceRows, ...rows] }));
  }
  function downloadTemplate() {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'evidence-template.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  function toggleRule(ruleId) {
    const current = audit.rulesApplied || [];
    updateItem(audit.id, { rulesApplied: current.includes(ruleId) ? current.filter((r) => r !== ruleId) : [...current, ruleId] });
  }

  function runAssessment() {
    setRunning(true);
    setTimeout(() => {
      const { enrichedRows, observations: newObs } = assessEvidence(audit.evidenceRows, appliedRuleObjs);
      const keptObs = audit.observations.filter((o) => o.source === 'Manual' || o.status !== 'Pending');
      updateItem(audit.id, { evidenceRows: enrichedRows, observations: [...keptObs, ...newObs] });
      setRunning(false);
    }, 1000);
  }

  function addManualObservation() {
    if (!manualObs.type.trim() || !manualObs.detail.trim()) return;
    const obs = { id: `OBS-${Date.now()}`, evidenceId: manualObs.evidenceId || null, ruleId: null, type: manualObs.type, severity: manualObs.severity, detail: manualObs.detail, financialImpactInr: Number(manualObs.financialImpactInr) || 0, source: 'Manual', status: 'Pending', assignedTo: null, complianceEvidence: '', verifiedBy: '', rootCause: '', rootCauseCategory: '', capaDraft: '' };
    updateItem(audit.id, (a) => ({ observations: [obs, ...a.observations] }));
    setManualObs({ evidenceId: '', type: '', severity: 'Medium', detail: '', financialImpactInr: '' });
    setShowManualObs(false);
  }

  function rejectObservation(obsId) {
    updateItem(audit.id, (a) => ({ observations: a.observations.map((o) => (o.id === obsId ? { ...o, status: 'Rejected', verifiedBy: audit.leadAuditor } : o)) }));
  }
  function openEditObs(o) {
    setEditDraft({ type: o.type, severity: o.severity, detail: o.detail, financialImpactInr: o.financialImpactInr || 0 });
    setEditingObsId(o.id);
  }
  function saveEditObs() {
    updateItem(audit.id, (a) => ({ observations: a.observations.map((o) => (o.id === editingObsId ? { ...o, ...editDraft, financialImpactInr: Number(editDraft.financialImpactInr) || 0 } : o)) }));
    setEditingObsId(null);
  }
  function openAccept(o) {
    const suggestion = suggestRootCauseAndCapa(o);
    setCapaDraft({ ...suggestion, financialImpactInr: o.financialImpactInr || 0 });
    setAssignTo(DEPARTMENT_HEADS[0].name);
    setAssigningId(o.id);
  }
  function confirmAssign() {
    updateItem(audit.id, (a) => ({ observations: a.observations.map((o) => (o.id === assigningId ? { ...o, status: 'Assigned', assignedTo: assignTo, rootCause: capaDraft.rootCause, rootCauseCategory: capaDraft.rootCauseCategory, capaDraft: capaDraft.capaDraft, financialImpactInr: Number(capaDraft.financialImpactInr) || 0 } : o)) }));
    setAssigningId(null);
  }
  function verifyResolved(obsId) {
    updateItem(audit.id, (a) => ({ observations: a.observations.map((o) => (o.id === obsId ? { ...o, status: 'Resolved', verifiedBy: audit.leadAuditor } : o)) }));
  }
  function sendBack(obsId) {
    updateItem(audit.id, (a) => ({ observations: a.observations.map((o) => (o.id === obsId ? { ...o, status: 'Assigned' } : o)) }));
  }

  return (
    <>
      <button className="btn-ghost btn" style={{ marginBottom: 14 }} onClick={() => router.push('/audits')}>← Back</button>
      <div className="page-head">
        <div>
          <h1>{audit.title}</h1>
          <p>{auditType?.name} • {audit.quarter} • Lead: {audit.leadAuditor}</p>
        </div>
        <div style={{ textAlign: 'right', fontSize: 11.5, color: 'var(--text-dimmer)' }}>
          Acting as <b style={{ color: 'var(--text)' }}>{identityName}</b><br />{identityTitle}
        </div>
      </div>

      <div className="tabs">
        {TABS.map((t) => <button key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>)}
      </div>

      {tab === 'Overview' && (
        <>
          <div className="grid grid-4" style={{ marginBottom: 18 }}>
            <div className="card stat"><div className="k">Evidence Items</div><div className="v">{audit.evidenceRows.length}</div></div>
            <div className="card stat"><div className="k">Observations</div><div className="v">{audit.observations.length}</div></div>
            <div className="card stat"><div className="k">Pending Review</div><div className="v" style={{ color: 'var(--amber)' }}>{audit.observations.filter((o) => o.status === 'Pending').length}</div></div>
            <div className="card stat"><div className="k">Resolved</div><div className="v" style={{ color: 'var(--green)' }}>{audit.observations.filter((o) => o.status === 'Resolved').length}</div></div>
          </div>
          <div className="card" style={{ padding: '16px 18px', marginBottom: 18 }}>
            <span className="field-label">Scope</span>
            <p style={{ fontSize: 12.5, marginBottom: 12 }}>{auditType?.description}</p>
            <div className="row-2" style={{ marginBottom: 0 }}>
              <div><span className="field-label">Departments in scope</span><p style={{ fontSize: 12.5 }}>{audit.departments.join(', ')}</p></div>
              <div><span className="field-label">Period</span><p style={{ fontSize: 12.5 }}>{audit.startDate} → {audit.endDate}</p></div>
            </div>
          </div>

          <div className="card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span className="field-label" style={{ margin: 0 }}>Executive Summary</span>
              <button className="btn-sm ai" onClick={generateExecSummary} disabled={generatingSummary}>{generatingSummary ? 'Drafting…' : '✦ Generate Executive Summary'}</button>
            </div>
            {execSummaryDraft ? (
              <>
                <textarea style={{ minHeight: 110 }} value={execSummaryDraft} onChange={(e) => setExecSummaryDraft(e.target.value)} />
                <button className="btn-sm" style={{ marginTop: 8 }} onClick={() => updateItem(audit.id, { execSummary: execSummaryDraft })}>Save edits</button>
                <p className="hint" style={{ marginTop: 8, fontSize: 10.5, color: 'var(--text-dimmer)' }}>AI-drafted from current evidence and observations — edit freely before it's included in the Excel report.</p>
              </>
            ) : (
              <p style={{ fontSize: 12, color: 'var(--text-dimmer)' }}>Not generated yet — click the button once evidence and observations are in place.</p>
            )}
          </div>

          {audit.status === 'Closed' ? (
            <div className="card" style={{ padding: '16px 18px', marginTop: 18, background: 'var(--surface-2)' }}>
              <p style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>✓ This audit is Closed and has been added to the Audit Archive. Its approved findings are now available to next cycle's AI work-program generator for this audit type.</p>
            </div>
          ) : (
            isAuditTeam && (
              <div className="card" style={{ padding: '16px 18px', marginTop: 18 }}>
                <span className="field-label">Close this audit</span>
                <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 12 }}>
                  Archives this engagement permanently and feeds its approved findings into the AI work-program and risk-scoring engines for the next cycle. This audit type's risk score will also refresh to reflect today as the new "last audited" date.
                </p>
                <button className="btn btn-primary" onClick={closeAudit}>Close Audit &amp; Archive</button>
              </div>
            )
          )}
        </>
      )}

      {tab === 'Work Program' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p style={{ fontSize: 12.5, color: 'var(--text-dim)', maxWidth: 620 }}>
              AI-recommended test steps: recurring items resurfaced from prior-year findings for this audit type, plus newly suggested steps. Assign each to a team member and track status through to CAE approval.
            </p>
            {(!audit.workProgram || audit.workProgram.length === 0) && (
              <button className="btn-sm ai" onClick={() => updateItem(audit.id, { workProgram: generateWorkProgram(audit.auditTypeId, histObs) })}>✦ Generate Work Program</button>
            )}
          </div>
          {(audit.workProgram || []).length === 0 ? (
            <div className="card" style={{ padding: 24, textAlign: 'center' }}>
              <p style={{ fontSize: 12, color: 'var(--text-dimmer)' }}>No work program yet — click &quot;Generate Work Program&quot; above.</p>
            </div>
          ) : (
            (audit.workProgram || []).map((wp) => (
              <div className="wp-row" key={wp.id}>
                <span className={`badge ${wp.source === 'Historical Recurring' ? 'badge-amber' : 'badge-teal'}`}>{wp.source === 'Historical Recurring' ? '↻ Recurring' : '✦ AI Suggested'}</span>
                <div className="wp-task">{wp.task}</div>
                <select value={wp.assignedTo || ''} onChange={(e) => updateItem(audit.id, (a) => ({ workProgram: a.workProgram.map((w) => (w.id === wp.id ? { ...w, assignedTo: e.target.value } : w)) }))}>
                  <option value="">Unassigned</option>
                  {AUDIT_TEAM.map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
                </select>
                <select value={wp.status} onChange={(e) => updateItem(audit.id, (a) => ({ workProgram: a.workProgram.map((w) => (w.id === wp.id ? { ...w, status: e.target.value } : w)) }))}>
                  <option>Not Started</option><option>In Progress</option><option>Review Stage</option><option>CAE Approved</option>
                </select>
              </div>
            ))
          )}
        </>
      )}

      {tab === 'Evidence' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="field-label" style={{ margin: 0 }}>Option A — Quick Submit (one claim at a time, matches the individual-employee flow)</span>
            <button className="btn-sm ai" onClick={() => { if (!showQuick) setQuickForm((f) => ({ ...f, category: f.category || categories[0] })); setShowQuick((v) => !v); }}>{showQuick ? 'Close' : '+ Quick Submit a Claim'}</button>
          </div>
          {showQuick && (
            <div className="card" style={{ padding: '16px 18px', marginBottom: 20 }}>
              <div className="row-2" style={{ marginTop: 0 }}>
                <div><span className="field-label">Employee</span><input value={quickForm.employee} onChange={(e) => setQuickForm({ ...quickForm, employee: e.target.value })} placeholder="e.g. Sarah Mitchell" /></div>
                <div><span className="field-label">Category</span>
                  <select value={quickForm.category} onChange={(e) => setQuickForm({ ...quickForm, category: e.target.value })}>
                    <option value="" disabled>Select category…</option>
                    {categories.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="row-2">
                <div><span className="field-label">Vendor</span><input value={quickForm.vendor} onChange={(e) => setQuickForm({ ...quickForm, vendor: e.target.value })} placeholder="e.g. Emirates" /></div>
                <div><span className="field-label">Claimed amount (₹)</span><input type="number" value={quickForm.amount} onChange={(e) => setQuickForm({ ...quickForm, amount: e.target.value })} /></div>
              </div>
              <div className="row-2">
                <div><span className="field-label">Date</span><input type="date" value={quickForm.date} onChange={(e) => setQuickForm({ ...quickForm, date: e.target.value })} /></div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <label className="check-row" style={{ width: '100%' }}>
                    <input type="checkbox" checked={quickForm.receiptAttached} onChange={(e) => setQuickForm({ ...quickForm, receiptAttached: e.target.checked })} />
                    Receipt attached (simulated upload)
                  </label>
                </div>
              </div>
              {!quickResult ? (
                <button className="btn btn-primary" onClick={runQuickOcr} disabled={quickRunning || appliedRuleObjs.length === 0}>{quickRunning ? 'Reading receipt with OCR…' : '✦ Run OCR & Auto-Audit'}</button>
              ) : (
                <>
                  <div className="card" style={{ padding: '12px 14px', marginBottom: 12, background: 'var(--surface-2)' }}>
                    <div style={{ fontSize: 12, display: 'flex', justifyContent: 'space-between' }}><span>OCR-extracted amount</span><b>₹{quickResult.ocrAmount}</b></div>
                    <div style={{ fontSize: 12, display: 'flex', justifyContent: 'space-between' }}><span>OCR confidence</span><b>{quickResult.ocrConfidence}</b></div>
                    <div style={{ fontSize: 12, display: 'flex', justifyContent: 'space-between' }}><span>Observations generated</span><b>{quickResult.observations.length}</b></div>
                  </div>
                  {quickResult.observations.length > 0 && (
                    <div className="chip-list" style={{ marginBottom: 12 }}>
                      {quickResult.observations.map((o, idx) => (
                        <div className="chip" key={idx}><span className="ico warn">!</span><span><b>{o.type}</b> ({o.severity}): {o.detail}</span></div>
                      ))}
                    </div>
                  )}
                  <button className="btn btn-primary" onClick={confirmQuickSubmit}>Submit Claim{quickResult.observations.length > 0 ? ' (routes to Audit review)' : ' (no issues found)'}</button>
                </>
              )}
              {appliedRuleObjs.length === 0 && <p className="cell-dim" style={{ marginTop: 10, fontSize: 11.5 }}>Select at least one rule under &quot;Rules Applied&quot; first.</p>}
              <div className="hint" style={{ marginTop: 10, fontSize: 10.5, color: 'var(--text-dimmer)' }}>Simulated OCR — not a live vision model call.</div>
            </div>
          )}

          <span className="field-label">Option B — Bulk Upload (a sheet of all details a team member has submitted)</span>
          <div className="dropzone" onClick={() => fileInput.current?.click()} style={{ marginBottom: 16, marginTop: 8 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ margin: '0 auto' }}><path d="M12 16V4m0 0-4 4m4-4 4 4" /><path d="M5 16v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3" /></svg>
            <div className="dz-title">Upload evidence sheet (CSV)</div>
            <div className="dz-sub">Click to browse, or use the sample sheet below to try it instantly</div>
            <input ref={fileInput} type="file" accept=".csv" onChange={handleFile} style={{ display: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <button className="btn btn-ghost" onClick={loadSample}>Load Sample Sheet</button>
            <button className="btn btn-ghost" onClick={downloadTemplate}>Download CSV Template</button>
          </div>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead><tr><th>ID</th><th>Employee</th><th>Category</th><th>Vendor</th><th>Amount</th><th>OCR Read</th><th>Date</th><th>Receipt</th></tr></thead>
                <tbody>
                  {audit.evidenceRows.map((r) => (
                    <tr key={r.id}>
                      <td className="cell-dim">{r.id}</td>
                      <td className="cell-strong">{r.employee}</td>
                      <td>{r.category}</td>
                      <td className="cell-dim">{r.vendor}</td>
                      <td className="cell-dim">₹{r.amount}</td>
                      <td className="cell-dim">{r.ocrAmount != null ? `₹${r.ocrAmount} (${r.ocrConfidence})` : '—'}</td>
                      <td className="cell-dim">{r.date}</td>
                      <td>{r.receiptAttached === 'Yes' ? <span className="badge badge-green">Yes</span> : <span className="badge badge-red">No</span>}</td>
                    </tr>
                  ))}
                  {audit.evidenceRows.length === 0 && <tr><td colSpan={8} className="cell-dim" style={{ textAlign: 'center', padding: 20 }}>No evidence uploaded yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'Rules Applied' && (
        <div className="card" style={{ padding: '16px 18px' }}>
          <span className="field-label">Select which Rules Universe entries apply to this {auditType?.name}</span>
          {applicableRules.length === 0 && <p style={{ fontSize: 12.5, color: 'var(--text-dimmer)' }}>No rules defined for this audit type yet — add some in the Rules Universe.</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {applicableRules.map((r) => (
              <label className="check-row" key={r.id} style={{ justifyContent: 'flex-start' }}>
                <input type="checkbox" checked={(audit.rulesApplied || []).includes(r.id)} onChange={() => toggleRule(r.id)} />
                <div>
                  <b>{r.name}</b> — {r.description} {r.value != null && r.value !== '' ? `(threshold: ₹${r.value})` : ''}
                </div>
                <span className={`badge ${sevBadge(r.severity)}`} style={{ marginLeft: 'auto' }}>{r.severity}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {tab === 'AI Assessment' && (
        <div className="card" style={{ padding: '16px 18px' }}>
          <p style={{ fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 14 }}>
            Runs simulated OCR over each evidence row, then checks it against all {appliedRuleObjs.length} rule(s) applied above and drafts a suggested observation for anything that looks off. Nothing is final from here — every suggestion lands in Observations as <b>Pending</b>, where the Audit Team reviews, edits, and explicitly approves or rejects it.
          </p>
          <button className="btn btn-primary" onClick={runAssessment} disabled={running || audit.evidenceRows.length === 0 || appliedRuleObjs.length === 0}>
            {running ? 'Reading evidence with OCR & checking rules…' : '✦ Run OCR & Rule Assessment'}
          </button>
          {appliedRuleObjs.length === 0 && <p className="cell-dim" style={{ marginTop: 10, fontSize: 11.5 }}>Select at least one rule under &quot;Rules Applied&quot; first.</p>}
          <div className="hint" style={{ marginTop: 12, fontSize: 10.5, color: 'var(--text-dimmer)' }}>Simulated — a heuristic engine, not a live vision/LLM call. Where evidence doesn't carry a direct signal, suggestions are lower-confidence pattern matches, not certainties — that's exactly why they need your review.</div>
        </div>
      )}

      {tab === 'Observations' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button className="btn-sm ai" onClick={() => setShowManualObs((v) => !v)}>{showManualObs ? 'Cancel' : '+ Add Observation Manually'}</button>
          </div>
          {showManualObs && (
            <div className="card" style={{ padding: '16px 18px', marginBottom: 16 }}>
              <div className="row-2">
                <div><span className="field-label">Related evidence ID (optional)</span>
                  <select value={manualObs.evidenceId} onChange={(e) => setManualObs({ ...manualObs, evidenceId: e.target.value })}>
                    <option value="">None</option>
                    {audit.evidenceRows.map((r) => <option key={r.id} value={r.id}>{r.id} — {r.employee}</option>)}
                  </select>
                </div>
                <div><span className="field-label">Severity</span>
                  <select value={manualObs.severity} onChange={(e) => setManualObs({ ...manualObs, severity: e.target.value })}>
                    <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
                  </select>
                </div>
              </div>
              <span className="field-label">Observation type</span>
              <input value={manualObs.type} onChange={(e) => setManualObs({ ...manualObs, type: e.target.value })} placeholder="e.g. Unauthorized upgrade to business class" style={{ marginBottom: 12 }} />
              <span className="field-label">Detail</span>
              <textarea value={manualObs.detail} onChange={(e) => setManualObs({ ...manualObs, detail: e.target.value })} style={{ marginBottom: 12 }} />
              <span className="field-label">Estimated financial impact (₹)</span>
              <input type="number" value={manualObs.financialImpactInr} onChange={(e) => setManualObs({ ...manualObs, financialImpactInr: e.target.value })} placeholder="0" />
              <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={addManualObservation}>Add observation</button>
            </div>
          )}

          <div className="card">
            <div className="table-wrap">
              <table>
                <thead><tr><th>ID</th><th>Evidence</th><th>Type</th><th>Severity</th><th>Detail</th><th>Source</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {audit.observations.map((o) => (
                    <tr key={o.id}>
                      <td className="cell-dim">{o.id.slice(0, 12)}</td>
                      <td className="cell-strong">{o.evidenceId || '—'}</td>
                      <td>{o.type}</td>
                      <td><span className={`badge ${sevBadge(o.severity)}`}>{o.severity}</span></td>
                      <td className="cell-dim" style={{ maxWidth: 280 }}>
                        {o.detail}
                        {o.assignedTo && <div style={{ marginTop: 4 }}>Assigned to: <b>{o.assignedTo}</b></div>}
                        {o.rootCause && <div style={{ marginTop: 4 }}>Root cause: <b>{o.rootCause}</b>{o.rootCauseCategory ? ` (${o.rootCauseCategory})` : ''}</div>}
                        {o.capaDraft && <div style={{ marginTop: 4, fontStyle: 'italic' }}>CAPA: {o.capaDraft}</div>}
                        {o.financialImpactInr > 0 && <div style={{ marginTop: 4 }}>Financial impact: <b>₹{Number(o.financialImpactInr).toLocaleString('en-IN')}</b></div>}
                        {o.complianceEvidence && <div style={{ marginTop: 4, fontStyle: 'italic' }}>Compliance evidence: {o.complianceEvidence}</div>}
                      </td>
                      <td><span className="badge badge-gray">{o.source}</span></td>
                      <td><span className={`badge ${statusBadge(o.status)}`}>{o.status}</span></td>
                      <td>
                        {isAuditTeam && o.status === 'Pending' && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <button className="btn-sm ai" onClick={() => openAccept(o)}>Approve</button>
                            <button className="btn-sm" onClick={() => openEditObs(o)}>Edit</button>
                            <button className="btn-sm" onClick={() => rejectObservation(o.id)}>Reject</button>
                          </div>
                        )}
                        {isAuditTeam && o.status === 'Submitted for Review' && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn-sm ai" onClick={() => verifyResolved(o.id)}>Verify & Resolve</button>
                            <button className="btn-sm" onClick={() => sendBack(o.id)}>Send Back</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {audit.observations.length === 0 && <tr><td colSpan={8} className="cell-dim" style={{ textAlign: 'center', padding: 20 }}>No observations yet — run the AI assessment or add one manually.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'Report' && (
        <div className="card" style={{ padding: '18px 20px' }}>
          <p style={{ fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 14 }}>
            Generates a real, downloadable .xlsx workbook — Summary, Evidence, and Observations sheets — with your logo from Reports → Report branding (or a styled text header if none is set).
          </p>
          <button className="btn btn-primary" onClick={() => {
            let branding = {};
            try {
              branding = { orgName: window.localStorage.getItem('audit_org_name') || 'Mankind Pharma Ltd.', logoDataUrl: window.localStorage.getItem('audit_org_logo') };
            } catch (e) {}
            downloadAuditReport(audit, auditType, branding);
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" width="16" height="16"><path d="M12 4v11m0 0-4-4m4 4 4-4" /><path d="M5 19h14" /></svg>
            Generate Excel Audit Report
          </button>
        </div>
      )}
      {assigningId && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setAssigningId(null); }}>
          <div className="modal-card">
            <h2>Approve Observation — AI Root Cause &amp; CAPA</h2>
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 14 }}>The AI has drafted a likely root cause and a corrective/preventive action based on similar findings. Edit before assigning to a department head.</p>
            <span className="field-label">AI-suggested root cause</span>
            <input value={capaDraft.rootCause} onChange={(e) => setCapaDraft({ ...capaDraft, rootCause: e.target.value })} style={{ marginBottom: 12 }} />
            <span className="field-label">Root cause category</span>
            <select value={capaDraft.rootCauseCategory} onChange={(e) => setCapaDraft({ ...capaDraft, rootCauseCategory: e.target.value })} style={{ marginBottom: 12 }}>
              {ROOT_CAUSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <span className="field-label">Draft CAPA (Corrective / Preventive Action)</span>
            <textarea style={{ minHeight: 80, marginBottom: 12 }} value={capaDraft.capaDraft} onChange={(e) => setCapaDraft({ ...capaDraft, capaDraft: e.target.value })} />
            <span className="field-label">Estimated financial impact (₹)</span>
            <input type="number" value={capaDraft.financialImpactInr} onChange={(e) => setCapaDraft({ ...capaDraft, financialImpactInr: e.target.value })} style={{ marginBottom: 12 }} />
            <span className="field-label">Assign to Department Head</span>
            <select value={assignTo} onChange={(e) => setAssignTo(e.target.value)}>
              {DEPARTMENT_HEADS.map((p) => <option key={p.name} value={p.name}>{p.name} — {p.dept}</option>)}
            </select>
            <div className="modal-footer">
              <button className="btn-ghost btn" onClick={() => setAssigningId(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={confirmAssign}>Approve &amp; Assign</button>
            </div>
          </div>
        </div>
      )}
      {editingObsId && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setEditingObsId(null); }}>
          <div className="modal-card">
            <h2>Edit Observation</h2>
            <span className="field-label">Type</span>
            <input value={editDraft.type} onChange={(e) => setEditDraft({ ...editDraft, type: e.target.value })} style={{ marginBottom: 12 }} />
            <span className="field-label">Severity</span>
            <select value={editDraft.severity} onChange={(e) => setEditDraft({ ...editDraft, severity: e.target.value })} style={{ marginBottom: 12 }}>
              <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
            </select>
            <span className="field-label">Detail</span>
            <textarea style={{ minHeight: 90, marginBottom: 12 }} value={editDraft.detail} onChange={(e) => setEditDraft({ ...editDraft, detail: e.target.value })} />
            <span className="field-label">Estimated financial impact (₹)</span>
            <input type="number" value={editDraft.financialImpactInr} onChange={(e) => setEditDraft({ ...editDraft, financialImpactInr: e.target.value })} />
            <div className="modal-footer">
              <button className="btn-ghost btn" onClick={() => setEditingObsId(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveEditObs}>Save changes</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
