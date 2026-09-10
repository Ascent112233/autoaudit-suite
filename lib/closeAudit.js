// Called when an Audit Team member closes an engagement. This is what actually makes the
// platform learn cycle over cycle: the archive gets a permanent record, and every approved
// finding becomes raw material the next cycle's AI work-program generator can resurface.

export function buildArchiveEntry(audit, auditType) {
  const year = new Date(audit.startDate).getFullYear();
  const criticalFlags = audit.observations.filter((o) => o.severity === 'Critical').length;
  const stillOpen = audit.observations.some((o) => ['Pending', 'Assigned', 'Submitted for Review'].includes(o.status));
  const repeatFinding = (audit.workProgram || []).some((w) => w.source === 'Historical Recurring');
  return {
    id: `ARC-${year}-${Math.floor(100 + Math.random() * 900)}`,
    year,
    scope: auditType?.name || audit.auditTypeId,
    entity: audit.departments.join(', ') || auditType?.location || '—',
    leadAuditor: audit.leadAuditor,
    totalObservations: audit.observations.length,
    criticalFlags,
    mapStatus: stillOpen ? 'Open' : 'Closed',
    repeatFinding,
  };
}

export function buildHistoricalEntries(audit) {
  return audit.observations
    .filter((o) => o.status === 'Resolved' || o.status === 'Assigned')
    .map((o) => ({
      auditTypeId: audit.auditTypeId,
      year: new Date(audit.startDate).getFullYear(),
      text: `${o.type} — ${o.detail}`,
    }));
}

export function countOpenCritical(audit) {
  return audit.observations.filter((o) => o.severity === 'Critical' && !['Resolved', 'Rejected'].includes(o.status)).length;
}
