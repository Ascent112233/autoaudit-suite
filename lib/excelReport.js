import ExcelJS from 'exceljs';

export async function downloadAuditReport(audit, auditType, branding) {
  const orgName = branding?.orgName || 'Mankind Pharma Ltd.';
  const logoDataUrl = branding?.logoDataUrl || null;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'AutoAudit Internal Audit Suite';
  wb.created = new Date();

  // ---- Summary sheet ----
  const summary = wb.addWorksheet('Summary');
  summary.mergeCells('A1:F2');
  const header = summary.getCell('A1');
  header.value = `${orgName}  —  Internal Audit Report`;
  header.font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
  header.alignment = { vertical: 'middle', horizontal: 'left', indent: logoDataUrl ? 10 : 1 };
  summary.getRow(1).height = 20;
  summary.getRow(2).height = 20;
  for (let col = 1; col <= 6; col++) {
    summary.getCell(1, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };
    summary.getCell(2, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };
  }

  if (logoDataUrl) {
    try {
      const match = logoDataUrl.match(/^data:image\/(png|jpeg|jpg);base64,(.*)$/);
      if (match) {
        const extension = match[1] === 'jpg' ? 'jpeg' : match[1];
        const imageId = wb.addImage({ base64: logoDataUrl, extension });
        summary.addImage(imageId, { tl: { col: 0.1, row: 0.1 }, ext: { width: 70, height: 34 } });
      }
    } catch (e) {
      // If the logo fails to embed for any reason, the text header above still renders fine.
    }
  }

  const rows = [
    ['Audit Title', audit.title],
    ['Audit Type', auditType?.name || audit.auditTypeId],
    ['Quarter / Period', audit.quarter],
    ['Start Date', audit.startDate],
    ['End Date', audit.endDate],
    ['Lead Auditor', audit.leadAuditor],
    ['Department(s) in Scope', audit.departments.join(', ')],
    ['Status', audit.status],
    ['Total Evidence Items', String(audit.evidenceRows.length)],
    ['Total Observations', String(audit.observations.length)],
    ['Pending Observations', String(audit.observations.filter((o) => o.status === 'Pending').length)],
    ['Resolved Observations', String(audit.observations.filter((o) => o.status === 'Resolved').length)],
    ['Total Financial Impact Identified (₹)', `₹${audit.observations.reduce((sum, o) => sum + (Number(o.financialImpactInr) || 0), 0).toLocaleString('en-IN')}`],
  ];
  let r = 4;
  rows.forEach(([label, value]) => {
    summary.getCell(r, 1).value = label;
    summary.getCell(r, 1).font = { bold: true };
    summary.getCell(r, 2).value = value;
    r++;
  });
  summary.getColumn(1).width = 26;
  summary.getColumn(2).width = 46;

  if (audit.execSummary) {
    const sumRow = r + 1;
    summary.getCell(sumRow, 1).value = 'Executive Summary';
    summary.getCell(sumRow, 1).font = { bold: true, size: 12 };
    summary.mergeCells(sumRow + 1, 1, sumRow + 1, 6);
    const cell = summary.getCell(sumRow + 1, 1);
    cell.value = audit.execSummary;
    cell.alignment = { wrapText: true, vertical: 'top' };
    summary.getRow(sumRow + 1).height = 90;
  }

  // ---- Evidence sheet ----
  const ev = wb.addWorksheet('Evidence');
  ev.columns = [
    { header: 'ID', key: 'id', width: 12 },
    { header: 'Employee', key: 'employee', width: 20 },
    { header: 'Category', key: 'category', width: 18 },
    { header: 'Vendor', key: 'vendor', width: 22 },
    { header: 'Claimed Amount', key: 'amount', width: 15 },
    { header: 'OCR Read', key: 'ocrAmount', width: 12 },
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Receipt Attached', key: 'receiptAttached', width: 16 },
  ];
  ev.getRow(1).font = { bold: true };
  ev.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  audit.evidenceRows.forEach((row) => ev.addRow(row));

  // ---- Observations sheet ----
  const obs = wb.addWorksheet('Observations');
  obs.columns = [
    { header: 'ID', key: 'id', width: 14 },
    { header: 'Evidence ID', key: 'evidenceId', width: 12 },
    { header: 'Rule / Type', key: 'type', width: 30 },
    { header: 'Severity', key: 'severity', width: 12 },
    { header: 'Detail', key: 'detail', width: 55 },
    { header: 'Financial Impact (₹)', key: 'financialImpactInr', width: 18 },
    { header: 'Root Cause Category', key: 'rootCauseCategory', width: 18 },
    { header: 'Root Cause', key: 'rootCause', width: 30 },
    { header: 'CAPA', key: 'capaDraft', width: 40 },
    { header: 'Source', key: 'source', width: 10 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Assigned To', key: 'assignedTo', width: 18 },
    { header: 'Compliance Evidence', key: 'complianceEvidence', width: 40 },
    { header: 'Verified By', key: 'verifiedBy', width: 16 },
  ];
  obs.getRow(1).font = { bold: true };
  obs.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  audit.observations.forEach((o) => obs.addRow(o));
  obs.eachRow((row, idx) => {
    if (idx === 1) return;
    const sevCell = row.getCell(4);
    const sev = String(sevCell.value || '').toLowerCase();
    const colorMap = { critical: 'FFFEE2E2', high: 'FFFEE2E2', medium: 'FFFFFBEB', low: 'FFF1F5F9' };
    if (colorMap[sev]) sevCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colorMap[sev] } };
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${audit.id}-Audit-Report.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
