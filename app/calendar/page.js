'use client';

import Link from 'next/link';
import { useLocalList } from '../../lib/useLocalList';
import { SEED_AUDITS, AUDIT_TYPES } from '../../lib/auditData';

const QUARTERS = ['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026'];

export default function Calendar() {
  const { items: audits } = useLocalList('audit_engagements_v2', SEED_AUDITS);

  return (
    <>
      <div className="page-head">
        <h1>Audit Calendar</h1>
        <p>Annual planning view — where each scheduled engagement falls across the fiscal year. Click an item to open it.</p>
      </div>
      <div className="cal-grid">
        {QUARTERS.map((q) => (
          <div className="card cal-quarter" key={q}>
            <h4>{q}</h4>
            {audits.filter((a) => a.quarter === q).length === 0 ? (
              <p style={{ fontSize: 11.5, color: 'var(--text-dimmer)' }}>No audits scheduled</p>
            ) : (
              audits.filter((a) => a.quarter === q).map((a) => (
                <Link href={`/audits/${a.id}`} className="cal-item" key={a.id} style={{ display: 'block' }}>
                  <div className="ci-type">{AUDIT_TYPES.find((t) => t.id === a.auditTypeId)?.name}</div>
                  <div className="ci-date">{a.startDate} → {a.endDate}</div>
                </Link>
              ))
            )}
          </div>
        ))}
      </div>
    </>
  );
}

