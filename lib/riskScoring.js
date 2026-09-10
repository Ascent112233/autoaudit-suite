function monthsSince(dateStr) {
  const then = new Date(dateStr);
  const now = new Date();
  return (now.getFullYear() - then.getFullYear()) * 12 + (now.getMonth() - then.getMonth());
}

// Simple, explainable risk-based audit planning score — the kind of methodology an IIA-aligned
// audit function actually uses: inherent risk of the area, how long it's been since it was last
// looked at, and how much known unresolved critical exposure carried over from the last cycle.
export function computeRiskScore(type) {
  const drivers = [];

  const inherentPoints = type.inherentRisk * 10; // 10-50
  drivers.push(`Inherent risk rating ${type.inherentRisk}/5 for ${type.category}`);

  const staleness = monthsSince(type.lastAuditDate);
  const stalenessPoints = Math.min(30, staleness * 1.5);
  if (staleness >= 6) drivers.push(`${staleness} months since last audit`);

  const exposurePoints = Math.min(30, type.unresolvedCritical * 15);
  if (type.unresolvedCritical > 0) drivers.push(`${type.unresolvedCritical} unresolved critical finding${type.unresolvedCritical > 1 ? 's' : ''} carried from last cycle`);

  const score = Math.round(inherentPoints + stalenessPoints + exposurePoints);
  const tier = score >= 75 ? 'Critical' : score >= 55 ? 'High' : score >= 35 ? 'Medium' : 'Low';

  return { score: Math.min(100, score), tier, drivers };
}

export function rankAuditUniverse(types) {
  return types
    .map((t) => ({ ...t, risk: computeRiskScore(t) }))
    .sort((a, b) => b.risk.score - a.risk.score);
}
