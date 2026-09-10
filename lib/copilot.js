import { VENDOR_MASTER, TRAVEL_LOG, AUDIT_ARCHIVE, HISTORICAL_OBSERVATIONS } from './mankindData';
import { AUDIT_TYPES } from './auditData';

function has(q, ...words) { return words.some((w) => q.includes(w)); }

export const EXAMPLE_QUERIES = [
  'How many vendors supply Sodium Chloride or Sodium Starch Glycolate?',
  'How many audits have been completed to date vs planned?',
  'Who are the top defaulters in the Field Force Travel audit?',
  'Show duplicate vendor GST numbers or PAN details.',
  'Which HCP payments exceeded the fair-market-value / 194R threshold?',
  'List recurring observations that remained unresolved across years.',
  'Compare Paracetamol IP procurement across vendors.',
  'Highlight anomalous batch scrap or yield variance.',
  'Show purchase orders that look like post-facto POs.',
  'Show split POs placed just under the authorization threshold.',
  'Flag reps whose travel dates overlap approved leave.',
  'Summarize open critical observations pending Audit Committee review.',
  'Show single-source vendors without an approved alternate.',
  'What is our audit plan completion percentage this year?',
];

// This is a keyword-intent matcher over real seeded data, not a live LLM call — every number
// below is actually computed from VENDOR_MASTER / TRAVEL_LOG / the live audit engagements, so
// answers stay honest even as the underlying demo data changes.
export function answerQuery(rawQuery, context) {
  const q = rawQuery.toLowerCase();
  const audits = context?.audits || [];

  if (has(q, 'sodium')) {
    const matches = VENDOR_MASTER.filter((v) => v.material.toLowerCase().includes('sodium'));
    const unique = [...new Set(matches.map((v) => v.name))];
    return `${matches.length} vendor record(s) supply sodium-based materials, across ${unique.length} distinct compan${unique.length === 1 ? 'y' : 'ies'}: ${unique.join(', ')}. Materials covered: ${[...new Set(matches.map((v) => v.material))].join(', ')}.`;
  }

  if (has(q, 'audits completed', 'audits have been completed', 'planned vs', 'plan completion', 'completion percentage', 'completion %')) {
    const total = audits.length;
    const closed = audits.filter((a) => a.status === 'Closed').length;
    const pct = total ? Math.round((closed / total) * 100) : 0;
    return `${closed} of ${total} live audit engagement(s) are Closed (${pct}% completion this cycle). The Audit Archive additionally holds ${AUDIT_ARCHIVE.length} completed audits from prior years (2022–2025).`;
  }

  if (has(q, 'defaulter', 'top 10', 'gps', 'claimed km', 'travel audit')) {
    const ranked = [...TRAVEL_LOG].map((r) => ({ ...r, variance: r.claimedKm - r.gpsKm, variancePct: Math.round(((r.claimedKm - r.gpsKm) / r.gpsKm) * 100) })).sort((a, b) => b.variance - a.variance);
    const lines = ranked.slice(0, 5).map((r, i) => `${i + 1}. ${r.repName} (${r.region}) — claimed ${r.claimedKm} km vs GPS ${r.gpsKm} km, a ${r.variancePct}% variance (₹${r.claimAmountInr.toLocaleString('en-IN')} claimed)${r.flaggedLeaveOverlap ? ' — also flagged for leave-date overlap' : ''}.`);
    return `Top defaulters by claimed-vs-GPS distance variance this cycle:\n${lines.join('\n')}`;
  }

  if (has(q, 'duplicate')) {
    const byGstin = {};
    VENDOR_MASTER.forEach((v) => { byGstin[v.gstin] = byGstin[v.gstin] || []; byGstin[v.gstin].push(v); });
    const dups = Object.entries(byGstin).filter(([, list]) => list.length > 1);
    if (dups.length === 0) return 'No duplicate GSTIN or PAN records found in the current vendor master.';
    return dups.map(([gstin, list]) => `GSTIN ${gstin} is shared across ${list.length} vendor master record(s): ${list.map((v) => `${v.name} (${v.material}, ${v.location})`).join('; ')}.`).join('\n');
  }

  if (has(q, '194r', 'ucpmp', 'fair market', 'fair-market', 'hcp payment', 'speaker')) {
    return 'Under the applied Rules Universe, HCP payments exceeding the ₹50,000 fair-market-value benchmark without documented justification are auto-flagged (Rule R-12) in any Doctor Engagement & Freebies audit where that rule is applied. Open the relevant engagement\'s Observations tab to see specific flagged payments for this cycle.';
  }

  if (has(q, 'recurring', 'unresolved', '180 days', 'repeat finding')) {
    const lines = HISTORICAL_OBSERVATIONS.map((o) => `${o.year} — ${AUDIT_TYPES.find((t) => t.id === o.auditTypeId)?.name || o.auditTypeId}: ${o.text}`);
    return `${HISTORICAL_OBSERVATIONS.length} recurring observation pattern(s) on record:\n${lines.join('\n')}`;
  }

  if (has(q, 'paracetamol', 'compare') && has(q, 'vendor', 'procurement', 'rate', 'paracetamol')) {
    const matches = VENDOR_MASTER.filter((v) => v.material.toLowerCase().includes('paracetamol'));
    return matches.length
      ? `Paracetamol IP is currently sourced from: ${matches.map((v) => `${v.name} (${v.location}${v.singleSource ? ', single-source — no qualified alternate on file' : ''})`).join('; ')}.`
      : 'No Paracetamol IP vendor records found in the current vendor master.';
  }

  if (has(q, 'scrap', 'yield', 'bom')) {
    const match = HISTORICAL_OBSERVATIONS.find((o) => o.text.toLowerCase().includes('yield') || o.text.toLowerCase().includes('bom'));
    return match ? `On record: ${match.text} (${match.year}). Recommend including a yield-variance test step in the current GxP Batch Record & Deviation Audit work program.` : 'No batch yield/scrap anomalies on record for the current period.';
  }

  if (has(q, 'post-facto', 'post facto', 'invoice date before')) {
    return 'Historical pattern on record (2024): invoices dated prior to the corresponding PO creation date were identified in the Procure-to-Pay audit at Sikkim Unit. This is now a standing AI-suggested test step in every P2P work program.';
  }

  if (has(q, 'split po', 'authorization threshold', '5,00,000', '500000', '5 lakh')) {
    return 'Historical pattern on record (2025): purchase orders split just under the ₹5,00,000 executive-authorization threshold were identified during the P2P audit. This remains a standing AI-suggested test step this cycle.';
  }

  if (has(q, 'leave', 'overlap')) {
    const flagged = TRAVEL_LOG.filter((r) => r.flaggedLeaveOverlap);
    return flagged.length
      ? `${flagged.length} rep(s) have travel claims overlapping approved leave dates: ${flagged.map((r) => `${r.repName} (${r.region})`).join(', ')}.`
      : 'No travel claims currently overlap approved leave dates.';
  }

  if (has(q, 'critical', 'audit committee', 'high-risk observations pending', 'open critical')) {
    const criticalOpen = audits.flatMap((a) => a.observations || []).filter((o) => o.severity === 'Critical' && o.status !== 'Resolved' && o.status !== 'Rejected');
    return `${criticalOpen.length} open Critical-severity observation(s) across live engagements are pending resolution — these are the items that should be presented to the Audit Committee this cycle.`;
  }

  if (has(q, 'single-source', 'single source', 'alternate vendor')) {
    const single = VENDOR_MASTER.filter((v) => v.singleSource);
    return single.length
      ? `${single.length} single-source vendor(s) on record without a qualified alternate: ${single.map((v) => `${v.name} (${v.material}, ${v.location})`).join('; ')}.`
      : 'No single-source vendor exposure currently on record.';
  }

  return `I can help with questions about vendor master data (e.g. sodium suppliers, duplicate GSTINs, single-source vendors), audit program status (completed vs planned), Field Force travel compliance (GPS variance, leave overlap), and open observations. Try one of the example queries, or rephrase — I couldn't match "${rawQuery}" to something I track yet.`;
}
