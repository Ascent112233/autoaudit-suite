'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocalList } from '../../lib/useLocalList';
import { SEED_AUDITS, AUDIT_TYPES } from '../../lib/auditData';
import { downloadAuditReport } from '../../lib/excelReport';

export default function Reports() {
  const { items: audits } = useLocalList('audit_engagements_v2', SEED_AUDITS);
  const [orgName, setOrgName] = useState('Mankind Pharma Ltd.');
  const [logoDataUrl, setLogoDataUrl] = useState(null);

  useEffect(() => {
    try {
      const savedName = window.localStorage.getItem('audit_org_name');
      const savedLogo = window.localStorage.getItem('audit_org_logo');
      if (savedName) setOrgName(savedName);
      if (savedLogo) setLogoDataUrl(savedLogo);
    } catch (e) {}
  }, []);

  function saveOrgName(v) {
    setOrgName(v);
    window.localStorage.setItem('audit_org_name', v);
  }
  function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setLogoDataUrl(dataUrl);
      try { window.localStorage.setItem('audit_org_logo', dataUrl); } catch (err) {}
    };
    reader.readAsDataURL(file);
  }

  return (
    <>
      <div className="page-head">
        <h1>Reports</h1>
        <p>Generate a standard-format Excel audit report for any engagement — Summary, Evidence, and Observations sheets, with your organization&apos;s logo embedded.</p>
      </div>

      <div className="card" style={{ padding: '16px 18px', marginBottom: 20 }}>
        <span className="field-label">Report branding</span>
        <div className="row-2" style={{ marginTop: 8 }}>
          <div>
            <span className="field-label">Organization name</span>
            <input value={orgName} onChange={(e) => saveOrgName(e.target.value)} />
          </div>
          <div>
            <span className="field-label">Logo (PNG or JPEG)</span>
            <input type="file" accept="image/png,image/jpeg" onChange={handleLogoUpload} style={{ padding: 7 }} />
          </div>
        </div>
        {logoDataUrl && (
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={logoDataUrl} alt="Logo preview" style={{ height: 34, borderRadius: 4, border: '1px solid var(--border)' }} />
            <span style={{ fontSize: 11.5, color: 'var(--text-dimmer)' }}>This logo will be embedded in every exported report.</span>
          </div>
        )}
        {!logoDataUrl && <p style={{ fontSize: 11.5, color: 'var(--text-dimmer)', marginTop: 8 }}>No logo uploaded yet — reports will use a styled text header instead.</p>}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Audit</th><th>Type</th><th>Status</th><th>Observations</th><th></th></tr></thead>
            <tbody>
              {audits.map((a) => (
                <tr key={a.id}>
                  <td className="cell-strong"><Link href={`/audits/${a.id}`} style={{ color: 'var(--brand)' }}>{a.title}</Link></td>
                  <td className="cell-dim">{AUDIT_TYPES.find((t) => t.id === a.auditTypeId)?.name}</td>
                  <td><span className="badge badge-purple">{a.status}</span></td>
                  <td className="cell-dim">{a.observations.length}</td>
                  <td>
                    <button className="btn-sm ai" onClick={() => downloadAuditReport(a, AUDIT_TYPES.find((t) => t.id === a.auditTypeId), { orgName, logoDataUrl })}>
                      Download .xlsx
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
