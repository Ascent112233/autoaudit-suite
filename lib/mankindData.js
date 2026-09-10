export const COMPANY = { name: 'Mankind Pharma Ltd.', short: 'Mankind Pharma' };

export const BUSINESS_UNITS = ['Domestic Formulations', 'Consumer Healthcare', 'API & Formulation R&D', 'Exports / International'];
export const PROCESSES = ['Procure-to-Pay (P2P)', 'Order-to-Cash (O2C)', 'Field Force Travel & Sales Expense', 'Doctor Engagement & Freebies (UCPMP)', 'Batch Quality Assurance & Yield Loss'];
export const LOCATIONS = ['Paonta Sahib Unit 1', 'Paonta Sahib Unit 2', 'Sikkim Unit', 'Okhla HQ', 'C&F Agent — North', 'C&F Agent — South'];

export const AUDIT_TEAM = [
  { name: 'R. Mehta', role: 'Senior Auditor — Manufacturing' },
  { name: 'S. Kapoor', role: 'Senior Auditor — Commercial Compliance' },
  { name: 'A. Nair', role: 'Auditor — IT & Data Integrity' },
  { name: 'V. Iyer', role: 'Auditor — Field Force & T&E' },
  { name: 'P. Chauhan', role: 'Auditor — Procurement & Vendor Master' },
];

// Vendor master — deliberately includes a duplicate GSTIN pair and a single-source API vendor
// so the AuditBrain copilot's duplicate/single-source queries have something real to find.
export const VENDOR_MASTER = [
  { id: 'V-1001', name: 'Himalaya Salt & Chemicals Pvt Ltd', material: 'Sodium Chloride', gstin: '02AABCH1234F1Z5', pan: 'AABCH1234F', location: 'Paonta Sahib Unit 1', singleSource: false },
  { id: 'V-1002', name: 'Northern Excipients Ltd', material: 'Sodium Starch Glycolate', gstin: '02AACNE5678K1Z2', pan: 'AACNE5678K', location: 'Paonta Sahib Unit 2', singleSource: false },
  { id: 'V-1003', name: 'Sunrise Pharma Chemicals', material: 'Sodium Citrate', gstin: '11AABCS9988P1Z7', pan: 'AABCS9988P', location: 'Okhla HQ', singleSource: false },
  { id: 'V-1004', name: 'Himalaya Salt & Chemicals Pvt Ltd', material: 'Sodium Bicarbonate', gstin: '02AABCH1234F1Z5', pan: 'AABCH1234F', location: 'Paonta Sahib Unit 1', singleSource: false },
  { id: 'V-1005', name: 'Vizag Marine Chemicals', material: 'Sodium Chloride', gstin: '37AAFCV4321Q1Z9', pan: 'AAFCV4321Q', location: 'Sikkim Unit', singleSource: false },
  { id: 'V-1006', name: 'Solitaire API Corp', material: 'Paracetamol IP', gstin: '06AAGCS7777L1Z3', pan: 'AAGCS7777L', location: 'Paonta Sahib Unit 1', singleSource: true },
  { id: 'V-1007', name: 'Nova Fine Chem', material: 'Paracetamol IP', gstin: '09AAJCN2345M1Z8', pan: 'AAJCN2345M', location: 'Sikkim Unit', singleSource: false },
];

// Field-force travel evidence — reused by the Travel & Expense audit and by the copilot's
// "top defaulters" query. distanceClaimedKm vs distanceGpsKm creates a real reconciliation gap.
export const TRAVEL_LOG = [
  { repName: 'Vikram Sharma', region: 'North', dateRange: '2026-08-01 to 2026-08-31', claimedKm: 2400, gpsKm: 1650, claimAmountInr: 28800, flaggedLeaveOverlap: false },
  { repName: 'Anjali Verma', region: 'North', dateRange: '2026-08-01 to 2026-08-31', claimedKm: 1900, gpsKm: 1820, claimAmountInr: 22800, flaggedLeaveOverlap: false },
  { repName: 'Rohit Malhotra', region: 'North', dateRange: '2026-08-01 to 2026-08-31', claimedKm: 3100, gpsKm: 1900, claimAmountInr: 37200, flaggedLeaveOverlap: true },
  { repName: 'Sneha Iyer', region: 'South', dateRange: '2026-08-01 to 2026-08-31', claimedKm: 2000, gpsKm: 1950, claimAmountInr: 24000, flaggedLeaveOverlap: false },
  { repName: 'Karan Bedi', region: 'North', dateRange: '2026-08-01 to 2026-08-31', claimedKm: 2750, gpsKm: 1400, claimAmountInr: 33000, flaggedLeaveOverlap: false },
  { repName: 'Deepak Rathore', region: 'West', dateRange: '2026-08-01 to 2026-08-31', claimedKm: 2200, gpsKm: 2100, claimAmountInr: 26400, flaggedLeaveOverlap: false },
];

// Historical recurring observations — the raw material the AI work-program engine draws on
// to auto-recommend this cycle's audit steps.
export const HISTORICAL_OBSERVATIONS = [
  { auditTypeId: 'AT-01', year: 2025, text: 'Missing HCP signature on sample receipts — recurred 3rd consecutive year at Northeast region.' },
  { auditTypeId: 'AT-01', year: 2024, text: 'Sample storage temperature excursions logged without disposition decision.' },
  { auditTypeId: 'AT-07', year: 2025, text: 'GPS vs claimed-distance variance exceeding 20% for multiple field reps in North region.' },
  { auditTypeId: 'AT-07', year: 2024, text: 'Travel claims submitted with dates overlapping approved leave.' },
  { auditTypeId: 'AT-08', year: 2025, text: 'Purchase orders split just under the ₹5,00,000 executive-authorization threshold.' },
  { auditTypeId: 'AT-08', year: 2024, text: 'Invoices dated prior to the corresponding PO creation date (post-facto PO).' },
  { auditTypeId: 'AT-06', year: 2025, text: 'HCP engagement spend not evidenced against Section 194R / UCPMP 2024 documentation requirements.' },
  { auditTypeId: 'AT-02', year: 2025, text: 'Batch yield variance at Paonta Sahib Unit 2 exceeding standard BOM tolerance without investigation.' },
];

// Historical Audit Universe Repository — every audit conducted in prior years, independent of
// the live engagements in audit_engagements. This is the permanent institutional record.
export const AUDIT_ARCHIVE = [
  { id: 'ARC-2025-014', year: 2025, scope: 'Field Force Travel & Sales Expense', entity: 'North Region', leadAuditor: 'V. Iyer', totalObservations: 9, criticalFlags: 2, mapStatus: 'Closed', repeatFinding: false },
  { id: 'ARC-2025-011', year: 2025, scope: 'Drug Sample Accountability', entity: 'Field Sales — Northeast', leadAuditor: 'R. Mehta', totalObservations: 6, criticalFlags: 1, mapStatus: 'Open', repeatFinding: true },
  { id: 'ARC-2025-007', year: 2025, scope: 'Procure-to-Pay (P2P)', entity: 'Paonta Sahib Unit 1', leadAuditor: 'P. Chauhan', totalObservations: 12, criticalFlags: 3, mapStatus: 'Open', repeatFinding: true },
  { id: 'ARC-2024-019', year: 2024, scope: 'Doctor Engagement & Freebies (UCPMP)', entity: 'Domestic Formulations', leadAuditor: 'S. Kapoor', totalObservations: 5, criticalFlags: 1, mapStatus: 'Closed', repeatFinding: false },
  { id: 'ARC-2024-013', year: 2024, scope: 'Batch Quality Assurance & Yield Loss', entity: 'Paonta Sahib Unit 2', leadAuditor: 'R. Mehta', totalObservations: 8, criticalFlags: 2, mapStatus: 'Closed', repeatFinding: false },
  { id: 'ARC-2024-009', year: 2024, scope: 'Field Force Travel & Sales Expense', entity: 'North Region', leadAuditor: 'V. Iyer', totalObservations: 7, criticalFlags: 1, mapStatus: 'Closed', repeatFinding: false },
  { id: 'ARC-2023-021', year: 2023, scope: 'Procure-to-Pay (P2P)', entity: 'Sikkim Unit', leadAuditor: 'P. Chauhan', totalObservations: 10, criticalFlags: 2, mapStatus: 'Closed', repeatFinding: false },
  { id: 'ARC-2022-016', year: 2022, scope: 'Order-to-Cash (O2C)', entity: 'Exports / International', leadAuditor: 'S. Kapoor', totalObservations: 4, criticalFlags: 0, mapStatus: 'Closed', repeatFinding: false },
];
