import { HISTORICAL_OBSERVATIONS } from './mankindData';

const AI_SUGGESTED_BY_TYPE = {
  'AT-01': ['Cross-check sample distribution logs against physician license registry (NPPES-equivalent) for the audit period.', 'Sample cold-chain excursion trend analysis across all storage depots this quarter.'],
  'AT-02': ['Trend-analyze deviation investigation cycle times against the 30-day SOP target.', 'Sample-test CAPA effectiveness checks closed in the last two quarters.'],
  'AT-03': ['Review user access logs for shared-credential usage patterns on GxP systems.', 'Spot-check audit trail continuity across a random sample of batch records.'],
  'AT-04': ['Verify quality agreement renewal dates against the vendor master for all Tier-1 CMOs.', 'Review single-source API vendors for documented alternate-vendor qualification status.'],
  'AT-05': ['Sample-test informed consent forms for version currency against the latest IRB-approved protocol.', 'Reconcile investigational product accountability logs against site dispensing records.'],
  'AT-06': ['Analyze GST-R1 vs 3B invoice mismatches in HCP engagement and promotional spend.', 'Flag HCP payments exceeding fair-market-value benchmark without documented justification.'],
  'AT-07': ['Scan GPS vs claimed-distance logs for all Medical Reps this cycle.', 'Cross-reference travel claim dates against approved leave records for overlap.'],
  'AT-08': ['Scan for purchase orders split just under the ₹5,00,000 executive-authorization threshold.', 'Identify invoices dated prior to the corresponding PO creation date (post-facto PO).'],
  'AT-09': ['Verify GxP refresher training completion against the annual curriculum calendar.', 'Sample-test training records for staff who changed roles mid-year.'],
};

let counter = 0;
function taskId() { counter += 1; return `WP-${Date.now()}-${counter}`; }

// Generates the recommended work program for a new audit: recurring items pulled from prior-year
// observations for this audit type, plus new AI-suggested test steps. Nothing here is invented —
// the "Historical Recurring" items are literally last cycle's findings, resurfaced so nothing
// slips through a second year running. Pass the LIVE historical-observations list (which grows
// every time an audit is closed) rather than relying on the static seed, so the recommendations
// actually improve cycle over cycle.
export function generateWorkProgram(auditTypeId, historicalObservations = HISTORICAL_OBSERVATIONS) {
  const recurring = historicalObservations
    .filter((o) => o.auditTypeId === auditTypeId)
    .map((o) => ({ id: taskId(), task: `[${o.year} recurrence] ${o.text}`, source: 'Historical Recurring', assignedTo: null, status: 'Not Started' }));

  const suggested = (AI_SUGGESTED_BY_TYPE[auditTypeId] || ['Perform a general control walkthrough for this audit area.'])
    .map((t) => ({ id: taskId(), task: t, source: 'AI Suggested', assignedTo: null, status: 'Not Started' }));

  return [...recurring, ...suggested];
}
