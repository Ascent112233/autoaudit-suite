// Audit Universe — risk fields feed the AI risk-based planning engine.
// inherentRisk: 1-5 baseline regulatory/business risk for this audit type.
// lastAuditDate / unresolvedCritical: drive the "time since last look" and "known open exposure" risk factors.
export const AUDIT_TYPES = [
  { id: 'AT-01', name: 'Drug Sample Accountability Audit', category: 'GxP / Field Sales', businessUnit: 'Domestic Formulations', location: 'C&F Agent — North', description: 'Reconciles physician drug samples distributed by field sales against PDMA/GDP accountability requirements — signature capture, storage, and lot-level traceability.', frequency: 'Quarterly', inherentRisk: 5, lastAuditDate: '2025-11-15', unresolvedCritical: 1 },
  { id: 'AT-02', name: 'GxP Batch Record & Deviation Audit', category: 'Quality', businessUnit: 'API & Formulation R&D', location: 'Paonta Sahib Unit 2', description: 'Reviews executed batch records, deviation investigations, and CAPA closure against GMP requirements.', frequency: 'Quarterly', inherentRisk: 5, lastAuditDate: '2025-06-01', unresolvedCritical: 2 },
  { id: 'AT-03', name: 'Data Integrity & 21 CFR Part 11 Audit', category: 'Quality / IT', businessUnit: 'API & Formulation R&D', location: 'Okhla HQ', description: 'Assesses audit trail integrity, e-signature controls, and access provisioning on GxP systems against ALCOA+ principles.', frequency: 'Annual', inherentRisk: 5, lastAuditDate: '2025-02-10', unresolvedCritical: 0 },
  { id: 'AT-04', name: 'Vendor & CMO Qualification Audit', category: 'Third-Party / Supply Chain', businessUnit: 'API & Formulation R&D', location: 'Sikkim Unit', description: 'Reviews contract manufacturer and critical supplier qualification files, quality agreements, and audit-cycle compliance.', frequency: 'Annual', inherentRisk: 4, lastAuditDate: '2025-09-20', unresolvedCritical: 0 },
  { id: 'AT-05', name: 'Clinical Trial Site Audit', category: 'Clinical / GCP', businessUnit: 'API & Formulation R&D', location: 'Okhla HQ', description: 'Reviews informed consent documentation, protocol deviations, and investigational product accountability at trial sites.', frequency: 'Semi-Annual', inherentRisk: 5, lastAuditDate: '2024-12-05', unresolvedCritical: 1 },
  { id: 'AT-06', name: 'Doctor Engagement & Freebies Audit (UCPMP / Sec 194R)', category: 'Commercial Compliance', businessUnit: 'Domestic Formulations', location: 'Okhla HQ', description: 'Reviews HCP engagement spend, transfer-of-value documentation, and promotional material approval against UCPMP 2024 and Section 194R requirements.', frequency: 'Semi-Annual', inherentRisk: 4, lastAuditDate: '2025-07-12', unresolvedCritical: 0 },
  { id: 'AT-07', name: 'Field Force Travel & Sales Expense Audit', category: 'Financial', businessUnit: 'Domestic Formulations', location: 'C&F Agent — North', description: 'Reviews field rep travel claims for GPS-vs-claimed distance variance, policy compliance, and leave-date overlap.', frequency: 'Quarterly', inherentRisk: 2, lastAuditDate: '2026-08-01', unresolvedCritical: 0 },
  { id: 'AT-08', name: 'Procure-to-Pay (P2P) Audit', category: 'Financial', businessUnit: 'API & Formulation R&D', location: 'Paonta Sahib Unit 1', description: 'Reviews purchase orders, GST invoice matching, and approval threshold compliance for segregation of duties.', frequency: 'Semi-Annual', inherentRisk: 3, lastAuditDate: '2025-10-01', unresolvedCritical: 0 },
  { id: 'AT-09', name: 'HR & GxP Training Compliance Audit', category: 'Operational', businessUnit: 'Consumer Healthcare', location: 'Okhla HQ', description: 'Reviews role-based GxP training assignment, completion, and curriculum currency for regulated staff.', frequency: 'Annual', inherentRisk: 3, lastAuditDate: '2025-05-18', unresolvedCritical: 0 },
];

export const RULES = [
  // Drug Sample Accountability
  { id: 'R-01', name: 'Sample reconciliation variance', auditTypeId: 'AT-01', category: 'Threshold', field: 'amount', value: 2, severity: 'Critical', description: 'Sample count variance between distributed and reconciled quantity exceeds 2%.', autoDetectable: false },
  { id: 'R-02', name: 'Missing HCP signature', auditTypeId: 'AT-01', category: 'Documentation', field: 'receiptAttached', value: null, severity: 'Critical', description: 'Sample receipt is missing the required physician (HCP) signature — a PDMA requirement.', autoDetectable: true },
  { id: 'R-03', name: 'Sample storage temperature excursion', auditTypeId: 'AT-01', category: 'Control', field: 'amount', value: null, severity: 'High', description: 'Cold-chain sample storage log shows a temperature excursion without documented disposition.', autoDetectable: false },
  { id: 'R-04', name: 'Distribution to unlicensed practitioner', auditTypeId: 'AT-01', category: 'Control', field: 'vendor', value: null, severity: 'Critical', description: 'Samples distributed to a recipient without a verified active medical license on file.', autoDetectable: false },

  // GxP Batch Record & Deviation
  { id: 'R-05', name: 'Deviation investigation overdue', auditTypeId: 'AT-02', category: 'Control', field: 'date', value: 30, severity: 'High', description: 'Deviation investigation open beyond the 30-day SOP-defined timeline.', autoDetectable: false },
  { id: 'R-06', name: 'CAPA effectiveness check missing', auditTypeId: 'AT-02', category: 'Documentation', field: 'receiptAttached', value: null, severity: 'High', description: 'CAPA closed without a documented effectiveness check.', autoDetectable: true },

  // Data Integrity / Part 11
  { id: 'R-07', name: 'Audit trail disabled or gap detected', auditTypeId: 'AT-03', category: 'Control', field: 'amount', value: null, severity: 'Critical', description: 'System audit trail shows a disabled period or unexplained gap — an ALCOA+ / Part 11 finding.', autoDetectable: false },
  { id: 'R-08', name: 'Shared login credential in use', auditTypeId: 'AT-03', category: 'Control', field: 'vendor', value: null, severity: 'Critical', description: 'Evidence of a shared user account being used for GxP-relevant transactions.', autoDetectable: false },

  // Vendor & CMO Qualification
  { id: 'R-09', name: 'Quality agreement expired', auditTypeId: 'AT-04', category: 'Documentation', field: 'date', value: null, severity: 'High', description: 'Quality agreement with the contract manufacturer has expired or is unsigned.', autoDetectable: true },

  // Clinical Trial Site
  { id: 'R-10', name: 'Informed consent documentation gap', auditTypeId: 'AT-05', category: 'Documentation', field: 'receiptAttached', value: null, severity: 'Critical', description: 'Informed consent form missing a required date, version, or signature.', autoDetectable: true },
  { id: 'R-11', name: 'Investigational product accountability gap', auditTypeId: 'AT-05', category: 'Control', field: 'amount', value: null, severity: 'Critical', description: 'Investigational product accountability log does not reconcile with dispensing records.', autoDetectable: false },

  // Promotional / Speaker Program
  { id: 'R-12', name: 'HCP payment exceeds fair market value', auditTypeId: 'AT-06', category: 'Threshold', field: 'amount', value: 50000, severity: 'High', description: 'Speaker honorarium exceeds the ₹50,000 fair-market-value benchmark without documented justification.', autoDetectable: true },
  { id: 'R-13', name: 'Transfer-of-value not reported', auditTypeId: 'AT-06', category: 'Documentation', field: 'receiptAttached', value: null, severity: 'High', description: 'HCP payment not logged for Sunshine Act transfer-of-value reporting.', autoDetectable: true },

  // Travel & Expense (kept from the original build)
  { id: 'R-14', name: 'Meals per day cap', auditTypeId: 'AT-07', category: 'Threshold', field: 'amount', value: 2000, severity: 'Low', description: 'Meal expenses must not exceed ₹2,000/day without justification.', autoDetectable: true },
  { id: 'R-15', name: 'Hotel per night cap', auditTypeId: 'AT-07', category: 'Threshold', field: 'amount', value: 8000, severity: 'Low', description: 'Hotel rate must not exceed ₹8,000/night without justification.', autoDetectable: true },
  { id: 'R-16', name: 'Receipt required above threshold', auditTypeId: 'AT-07', category: 'Documentation', field: 'receiptAttached', value: 15000, severity: 'High', description: 'Any expense over ₹15,000 must have a receipt attached.', autoDetectable: true },
  { id: 'R-17', name: 'Airfare pre-approval threshold', auditTypeId: 'AT-07', category: 'Approval', field: 'amount', value: 40000, severity: 'Medium', description: 'Airfare over ₹40,000 requires documented pre-approval.', autoDetectable: true },
  { id: 'R-18', name: 'Non-business-day travel flag', auditTypeId: 'AT-07', category: 'Anomaly', field: 'date', value: null, severity: 'Low', description: 'Expenses dated on a weekend should have a stated business justification.', autoDetectable: true },
  { id: 'R-19', name: 'Duplicate claim detection', auditTypeId: 'AT-07', category: 'Anomaly', field: 'vendor', value: null, severity: 'High', description: 'Same vendor, amount, and date submitted more than once.', autoDetectable: true },

  // Procurement
  { id: 'R-20', name: 'Purchase order approval evidence', auditTypeId: 'AT-08', category: 'Approval', field: 'amount', value: 500000, severity: 'High', description: 'POs over ₹5,00,000 require documented two-level approval.', autoDetectable: true },
  { id: 'R-21', name: 'Segregation of duties', auditTypeId: 'AT-08', category: 'Control', field: 'vendor', value: null, severity: 'Critical', description: 'The PO requestor and approver must not be the same person.', autoDetectable: false },
];

export const DEPARTMENT_HEADS = [
  { name: 'Dr. Anil Sharma', dept: 'VP, Field Sales — Domestic Formulations' },
  { name: 'Neha Kulkarni', dept: 'Director, Quality Assurance — Paonta Sahib' },
  { name: 'Rajeev Menon', dept: 'Director, IT & Data Integrity' },
  { name: 'Dr. Kavita Reddy', dept: 'Head of Clinical Operations' },
  { name: 'Sanjay Bhatia', dept: 'Director, Commercial Compliance' },
  { name: 'Arvind Khanna', dept: 'Head of Procurement' },
];

import { generateWorkProgram } from './workProgram';

export const SEED_AUDITS = [
  {
    id: 'AUD-2026-Q3-SAMPLE',
    title: 'Q3 2026 Drug Sample Accountability Audit — Field Sales (Northeast Region)',
    auditTypeId: 'AT-01',
    quarter: 'Q3 2026',
    startDate: '2026-08-01',
    endDate: '2026-09-15',
    leadAuditor: 'R. Mehta',
    departments: ['Domestic Formulations'],
    status: 'Fieldwork',
    rulesApplied: ['R-01', 'R-02', 'R-03', 'R-04'],
    execSummary: '',
    workProgram: generateWorkProgram('AT-01'),
    evidenceRows: [
      { id: 'EV-001', employee: 'Rep: David Kim', category: 'Sample Distribution', vendor: 'Dr. Alan Weiss, MD (Internal Medicine)', amount: 48, date: '2026-08-05', receiptAttached: 'Yes' },
      { id: 'EV-002', employee: 'Rep: Nina Torres', category: 'Sample Distribution', vendor: 'Dr. Fatima Rashid, MD (Endocrinology)', amount: 36, date: '2026-08-07', receiptAttached: 'Yes' },
      { id: 'EV-003', employee: 'Rep: David Kim', category: 'Sample Distribution', vendor: 'Riverside Family Clinic', amount: 60, date: '2026-08-09', receiptAttached: 'No' },
      { id: 'EV-004', employee: 'Rep: Marcus Lee', category: 'Sample Distribution', vendor: 'Dr. Susan Patel, MD (Cardiology)', amount: 42, date: '2026-08-12', receiptAttached: 'Yes' },
      { id: 'EV-005', employee: 'Rep: Nina Torres', category: 'Sample Storage', vendor: 'Regional Sample Depot — Unit 4', amount: 0, date: '2026-08-14', receiptAttached: 'No' },
      { id: 'EV-006', employee: 'Rep: Marcus Lee', category: 'Sample Distribution', vendor: 'Dr. Susan Patel, MD (Cardiology)', amount: 42, date: '2026-08-12', receiptAttached: 'Yes' },
      { id: 'EV-007', employee: 'Rep: David Kim', category: 'Sample Distribution', vendor: 'Community Urgent Care — Unverified NPI', amount: 30, date: '2026-08-18', receiptAttached: 'Yes' },
    ],
    observations: [
      { id: 'OBS-201', evidenceId: 'EV-003', ruleId: 'R-02', type: 'Missing HCP signature', severity: 'Critical', detail: 'Sample receipt for Riverside Family Clinic (60 units, 2026-08-09) has no physician signature on file — a PDMA accountability gap.', source: 'AI', status: 'Pending', assignedTo: null, complianceEvidence: '', verifiedBy: '', rootCause: '', capaDraft: '' },
      { id: 'OBS-202', evidenceId: 'EV-005', ruleId: 'R-03', type: 'Sample storage temperature excursion', severity: 'High', detail: 'Regional Sample Depot Unit 4 cold-chain log shows a 6-hour excursion above 8°C on 2026-08-14 with no documented disposition decision.', source: 'AI', status: 'Assigned', assignedTo: 'Dr. Anil Sharma', complianceEvidence: '', verifiedBy: '', rootCause: 'Facilities / Environmental Monitoring Gap', capaDraft: 'Install redundant temperature alerting on Depot Unit 4 and retrain site staff on excursion escalation procedure within 30 days.' },
      { id: 'OBS-203', evidenceId: 'EV-006', ruleId: 'R-19', type: 'Possible duplicate distribution record', severity: 'Medium', detail: 'Same HCP, quantity, and date as EV-004 (Dr. Susan Patel, 42 units, 2026-08-12) — possible duplicate entry or double-count.', source: 'AI', status: 'Pending', assignedTo: null, complianceEvidence: '', verifiedBy: '', rootCause: '', capaDraft: '' },
      { id: 'OBS-204', evidenceId: 'EV-007', ruleId: 'R-04', type: 'Distribution to unverified practitioner', severity: 'Critical', detail: 'Community Urgent Care recipient NPI could not be verified as an active licensed practitioner at time of distribution.', source: 'AI', status: 'Resolved', assignedTo: 'Dr. Anil Sharma', complianceEvidence: 'NPI verified retroactively via NPPES registry — license was active but not queried at point of distribution. Rep re-trained on pre-distribution verification step.', verifiedBy: 'R. Mehta', rootCause: 'Training Gap — Field Rep Verification Step', capaDraft: 'Mandatory refresher training on point-of-distribution license verification for all Northeast reps within 15 days; add verification checkbox to sample distribution app.' },
    ],
  },
];
