export const ROOT_CAUSE_CATEGORIES = ['Policy Breach', 'System Gap', 'Fraud', 'Inadvertent Error'];

const ROOT_CAUSE_MAP = {
  'Missing HCP signature': { rootCause: 'Training Gap — Field Rep Documentation Step', category: 'Inadvertent Error', capa: 'Retrain affected reps on mandatory signature capture at point of sample distribution; add a hard-stop signature field to the distribution app.' },
  'Sample storage temperature excursion': { rootCause: 'Facilities / Environmental Monitoring Gap', category: 'System Gap', capa: 'Install redundant temperature alerting at the affected storage site and retrain staff on excursion escalation procedure within 30 days.' },
  'Possible duplicate distribution record': { rootCause: 'Process Gap — Duplicate Entry Control', category: 'System Gap', capa: 'Add a duplicate-check validation step to the sample logging process before submission is accepted.' },
  'Distribution to unverified practitioner': { rootCause: 'Training Gap — Field Rep Verification Step', category: 'Policy Breach', capa: 'Mandatory refresher training on point-of-distribution license verification; add a verification checkbox to the distribution workflow.' },
  'OCR mismatch': { rootCause: 'Data Entry / Evidence Quality Gap', category: 'Inadvertent Error', capa: 'Request a clearer copy of the source document from the submitter and confirm the correct amount before closing this item.' },
  'Deviation investigation overdue': { rootCause: 'Process Gap — Investigation Timeliness', category: 'Policy Breach', capa: 'Escalate the open investigation to Quality leadership and implement a tracking dashboard with automatic overdue alerts.' },
  'CAPA effectiveness check missing': { rootCause: 'Process Gap — CAPA Closure Control', category: 'Policy Breach', capa: 'Reopen the CAPA record and complete a documented effectiveness check before final closure.' },
  'Audit trail disabled or gap detected': { rootCause: 'System Gap — Configuration Control', category: 'System Gap', capa: 'Investigate the audit trail gap with IT, restore logging immediately, and review system configuration change-control records.' },
  'Shared login credential in use': { rootCause: 'System Gap — Access Control', category: 'Policy Breach', capa: 'Disable the shared account, provision individual credentials, and conduct a review of all GxP transactions made under the shared login.' },
  'Quality agreement expired': { rootCause: 'Process Gap — Vendor Contract Management', category: 'Policy Breach', capa: 'Renew the quality agreement with the contract manufacturer and add a 90-day-advance renewal reminder to the vendor management calendar.' },
  'Informed consent documentation gap': { rootCause: 'Training Gap — Site Coordinator Documentation', category: 'Inadvertent Error', capa: 'Retrain site coordinators on informed consent documentation requirements; conduct a 100% file review for the affected enrollment period.' },
  'HCP payment exceeds fair market value': { rootCause: 'Process Gap — Fair Market Value Review', category: 'Policy Breach', capa: 'Route the payment for fair-market-value justification review and update the pre-payment approval workflow to flag amounts above threshold automatically.' },
  'Transfer-of-value not reported': { rootCause: 'Process Gap — Compliance Reporting Control', category: 'Policy Breach', capa: 'Log the transfer of value in the Sunshine Act / Section 194R reporting system and add a pre-payment checklist item requiring reporting confirmation.' },
  'Purchase order approval evidence': { rootCause: 'Process Gap — Approval Workflow Control', category: 'Policy Breach', capa: 'Route the PO for retroactive second-level approval and reinforce the approval threshold policy with the procurement team.' },
  'Segregation of duties': { rootCause: 'Control Design Gap — Requestor/Approver Overlap', category: 'System Gap', capa: 'Reassign approval authority to a different individual and update the workflow to block same-person requestor/approver combinations going forward.' },
};

const DEFAULT_SUGGESTION = { rootCause: 'Process Gap — Control Design or Execution', category: 'System Gap', capa: 'Document the corrective action required to bring this item into compliance and assign an owner with a target closure date.' };

// AI root cause & CAPA drafting — offered at the moment an auditor approves a finding as valid,
// before it's routed to a department head. The auditor can and should edit this before it's saved.
// The category is the standard 4-way taxonomy (Policy Breach / System Gap / Fraud / Inadvertent
// Error) used for trend reporting across cycles; the free-text root cause is the specific detail.
export function suggestRootCauseAndCapa(observation) {
  const match = ROOT_CAUSE_MAP[observation.type];
  if (match) return { rootCause: match.rootCause, rootCauseCategory: match.category, capaDraft: match.capa };
  if (observation.severity === 'Critical') {
    return {
      rootCause: 'Control Gap — Requires Root Cause Investigation',
      rootCauseCategory: 'System Gap',
      capaDraft: `Conduct a formal root cause investigation into "${observation.type}" given its Critical severity; implement interim containment while the investigation is open.`,
    };
  }
  return { rootCause: DEFAULT_SUGGESTION.rootCause, rootCauseCategory: DEFAULT_SUGGESTION.category, capaDraft: DEFAULT_SUGGESTION.capa };
}
