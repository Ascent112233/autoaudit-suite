// Naive CSV parser — sufficient for simple, unquoted comma-separated sheets.
// Expected columns: employee, category, vendor, amount, date, receiptAttached
export function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',').map((c) => c.trim());
    const row = {};
    headers.forEach((h, idx) => { row[h] = cells[idx] ?? ''; });
    rows.push({
      id: `EV-${Date.now()}-${i}`,
      employee: row.employee || row.name || 'Unknown',
      category: row.category || 'Other',
      vendor: row.vendor || 'Unknown',
      amount: Number(row.amount) || 0,
      date: row.date || '',
      receiptAttached: /^(y|yes|true)$/i.test(row.receiptattached || row.receipt || '') ? 'Yes' : 'No',
    });
  }
  return rows;
}

export const SAMPLE_CSV = `employee,category,vendor,amount,date,receiptAttached
Sarah Mitchell,Airfare,Emirates,1650,2026-09-02,Yes
Tom Harris,Meals,Nobu Riyadh,88,2026-09-03,Yes
Lisa Anderson,Hotel,Dubai Marriott,270,2026-09-04,No
Priya Nair,Ground Transport,Uber,32,2026-09-04,Yes`;
