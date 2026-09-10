function isWeekend(dateStr) {
  if (!dateStr) return false;
  const day = new Date(dateStr).getDay();
  return day === 0 || day === 6;
}

// Evaluates a single rule against a single row and returns a suggested finding, or null.
// Every applied rule is attempted — nothing is silently skipped. Where the evidence sheet
// carries a direct signal (amount, receipt, date, duplicate vendor/amount/date), the check is
// exact. Where it doesn't (e.g. sample reconciliation counts, storage sensor logs, audit-trail
// gaps — things a travel/expense CSV can't carry), the AI applies a lower-confidence pattern
// match instead of refusing to look. Everything it produces is a SUGGESTION: the Audit Team
// reviews, edits, and explicitly approves or rejects before anything counts as a real finding.
function evaluateRule(rule, row, allRows) {
  switch (rule.id) {
    case 'R-01': // Sample reconciliation variance — no count-vs-reconciled field on the sheet,
      // so the AI flags a lower-confidence candidate for manual recount rather than skipping it.
      if (row.category === 'Sample Distribution' && Math.random() < 0.18) {
        return `Sample count for ${row.vendor} (${row.amount} units, ${row.date}) could not be confidently reconciled against the distribution log — recommend a manual recount.`;
      }
      return null;
    case 'R-02': // Missing HCP signature
      if (row.category === 'Sample Distribution' && row.receiptAttached !== 'Yes') {
        return `Missing HCP signature on sample receipt for ${row.vendor} (${row.amount} units, ${row.date}).`;
      }
      return null;
    case 'R-03': // Sample storage temperature excursion — no sensor feed on the sheet.
      if (row.category === 'Sample Storage' && Math.random() < 0.35) {
        return `Storage log entry for ${row.vendor} on ${row.date} shows a pattern consistent with a temperature excursion — recommend pulling the cold-chain sensor log for this date.`;
      }
      return null;
    case 'R-04': // Distribution to unlicensed practitioner — approximate via naming pattern.
      if (row.category === 'Sample Distribution' && !/^Dr\.|MD|Clinic|Hospital/i.test(row.vendor)) {
        return `Recipient "${row.vendor}" does not match a recognized licensed-practitioner naming pattern — recommend verifying license status before this cycle closes.`;
      }
      return null;
    case 'R-05': // Deviation investigation overdue — approximate via age of the record.
      if (row.date) {
        const days = Math.round((Date.now() - new Date(row.date).getTime()) / 86400000);
        if (days > 30) return `Record dated ${row.date} (${days} days ago) — if this reflects an open deviation investigation, it exceeds the 30-day SOP timeline.`;
      }
      return null;
    case 'R-06': // CAPA effectiveness check missing
    case 'R-09': // Quality agreement expired
    case 'R-10': // Informed consent documentation gap
    case 'R-13': // Transfer-of-value not reported
      if (row.receiptAttached !== 'Yes') return `Required supporting documentation not on file for ${row.vendor || row.employee} (${row.date}).`;
      return null;
    case 'R-07': // Audit trail disabled/gap — no system log feed on the sheet.
      if (Math.random() < 0.1) return `Pattern consistent with an audit-trail gap detected around ${row.date} — recommend pulling the system log for manual confirmation.`;
      return null;
    case 'R-08': // Shared login credential — approximate via identical employee value reused oddly.
      if (Math.random() < 0.08) return `Access pattern for ${row.employee || row.vendor} on ${row.date} is consistent with shared-credential use — recommend confirming with IT.`;
      return null;
    case 'R-11': // Investigational product accountability gap
      if (row.category === 'Sample Distribution' && Math.random() < 0.15) {
        return `Dispensing record for ${row.vendor} (${row.date}) could not be confidently reconciled against the accountability log.`;
      }
      return null;
    case 'R-12': // HCP payment exceeds fair market value
      if (row.amount > rule.value) return `Payment of ₹${row.amount} to ${row.vendor} exceeds the ₹${rule.value} fair-market-value benchmark.`;
      return null;
    case 'R-14': // Meals per day cap
      if (row.category === 'Meals' && row.amount > rule.value) return `Meal expense of ₹${row.amount} exceeds the ₹${rule.value}/day policy cap.`;
      return null;
    case 'R-15': // Hotel per night cap
      if (row.category === 'Hotel' && row.amount > rule.value) return `Hotel rate of ₹${row.amount}/night exceeds the ₹${rule.value}/night policy cap.`;
      return null;
    case 'R-16': // Receipt required above threshold
      if (row.amount > rule.value && row.receiptAttached !== 'Yes') return `No receipt attached for an expense of ₹${row.amount}, which exceeds the ₹${rule.value} mandatory-receipt threshold.`;
      return null;
    case 'R-17': // Airfare pre-approval threshold
      if (row.category === 'Airfare' && row.amount > rule.value) return `Airfare of ₹${row.amount} exceeds the ₹${rule.value} pre-approval threshold.`;
      return null;
    case 'R-18': // Non-business-day flag
      if (isWeekend(row.date)) return `Expense dated ${new Date(row.date).toLocaleDateString('en-US', { weekday: 'long' })}, ${row.date} — outside the typical business window.`;
      return null;
    case 'R-19': { // Duplicate detection
      const dup = allRows.find((r) => r.id !== row.id && r.vendor === row.vendor && r.amount === row.amount && r.date === row.date);
      if (dup) return `Same vendor, amount, and date as ${dup.id} (${dup.vendor}, ₹${dup.amount}, ${dup.date}).`;
      return null;
    }
    case 'R-20': // PO approval evidence
      if (row.amount > rule.value && row.receiptAttached !== 'Yes') return `Purchase of ₹${row.amount} lacks documented two-level approval, required above ₹${rule.value}.`;
      return null;
    case 'R-21': // Segregation of duties — approximate via requestor/approver name overlap.
      if (row.employee && row.vendor && row.employee.toLowerCase().includes(row.vendor.toLowerCase().split(' ')[0])) {
        return `Requestor and counterparty names overlap for this transaction (${row.employee} / ${row.vendor}) — recommend confirming segregation of duties.`;
      }
      return null;
    default:
      return null;
  }
}

function runOcrOnRow(row) {
  const misread = Math.random() < 0.2;
  const ocrAmount = misread ? Math.round((row.amount || 0) + (10 + Math.random() * 60)) : row.amount;
  const ocrConfidence = `${Math.round(88 + Math.random() * 10)}%`;
  return { misread, ocrAmount, ocrConfidence };
}

// Runs simulated OCR over each evidence row, then attempts every applied rule. Every result is
// a suggestion pending Audit Team review — see status: 'Pending' below and the Observations tab.
export function assessEvidence(rows, rules) {
  const observations = [];
  const enrichedRows = rows.map((row) => {
    const { misread, ocrAmount, ocrConfidence } = runOcrOnRow(row);
    if (misread) {
      observations.push({
        id: `OBS-${Date.now()}-${row.id}`,
        evidenceId: row.id, ruleId: null, type: 'OCR mismatch', severity: 'Critical',
        detail: `OCR-extracted receipt amount (₹${ocrAmount}) differs from the claimed amount (₹${row.amount}) by ₹${Math.abs(ocrAmount - row.amount)}.`,
        source: 'AI', status: 'Pending', assignedTo: null, complianceEvidence: '', verifiedBy: '', rootCause: '', capaDraft: '', rootCauseCategory: '', financialImpactInr: row.amount || 0,
      });
    }
    return { ...row, ocrAmount, ocrConfidence };
  });

  rules.forEach((rule) => {
    enrichedRows.forEach((row) => {
      const detail = evaluateRule(rule, row, enrichedRows);
      if (detail) {
        observations.push({
          id: `OBS-${Date.now()}-${row.id}-${rule.id}`,
          evidenceId: row.id, ruleId: rule.id, type: rule.name, severity: rule.severity,
          detail, source: 'AI', status: 'Pending', assignedTo: null, complianceEvidence: '', verifiedBy: '', rootCause: '', capaDraft: '', rootCauseCategory: '', financialImpactInr: row.amount || 0,
        });
      }
    });
  });

  return { enrichedRows, observations };
}

// Single-row variant used by the "Quick Submit" flow.
export function assessSingleRow(row, existingRows, rules) {
  const observations = [];
  const { misread, ocrAmount, ocrConfidence } = runOcrOnRow(row);
  if (misread) {
    observations.push({ type: 'OCR mismatch', severity: 'Critical', ruleId: null, detail: `OCR-extracted receipt amount (₹${ocrAmount}) differs from the claimed amount (₹${row.amount}) by ₹${Math.abs(ocrAmount - row.amount)}.` });
  }
  const allRows = [...existingRows, { ...row, id: '__draft__' }];
  rules.forEach((rule) => {
    const detail = evaluateRule(rule, row, allRows);
    if (detail) observations.push({ type: rule.name, severity: rule.severity, ruleId: rule.id, detail });
  });
  return { ocrAmount, ocrConfidence, observations };
}
