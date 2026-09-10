'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Icon from './Icon';
import { useIdentity, ALL_PEOPLE } from '../lib/identity';

const NAV = [
  { href: '/', label: 'Home', desc: 'Audit program overview', icon: 'home' },
  { href: '/audit-universe', label: 'Audit Universe', desc: 'Scope by BU, process, or plant', icon: 'globe' },
  { href: '/vendor-master', label: 'Vendor Master', desc: 'Vendors, duplicates & single-source', icon: 'sliders' },
  { href: '/difference-tracker', label: 'Difference Tracker', desc: 'Claimed vs GPS reconciliation', icon: 'clipboard-check' },
  { href: '/audit-archive', label: 'Audit Archive', desc: 'Historical record, all years', icon: 'book' },
  { href: '/rules-universe', label: 'Rules Universe', desc: 'Compliance rules & thresholds', icon: 'sliders' },
  { href: '/calendar', label: 'Audit Calendar', desc: 'Annual audit planning', icon: 'calendar' },
  { href: '/audits', label: 'Audits', desc: 'Scheduling & engagements', icon: 'clipboard-check' },
  { href: '/my-actions', label: 'My Assigned Items', desc: 'Department Head remediation', icon: 'users' },
  { href: '/team-tasks', label: 'Team Task Sheets', desc: 'AI-assigned work program tasks', icon: 'clipboard-check' },
  { href: '/copilot', label: 'AuditBrain Copilot', desc: 'Ask questions about your data', icon: 'file-text' },
  { href: '/reports', label: 'Reports', desc: 'Excel export', icon: 'folder' },
];

const TOPBAR = {
  '/': { title: 'Home', subtitle: 'Audit program overview — Mankind Pharma Ltd.' },
  '/audit-universe': { title: 'Audit Universe', subtitle: 'Scope by Business Unit, Process, or Plant/Entity' },
  '/vendor-master': { title: 'Vendor Master', subtitle: 'Vendor records with duplicate and single-source flags' },
  '/difference-tracker': { title: 'Difference Tracker', subtitle: 'Claimed vs verified reconciliation' },
  '/audit-archive': { title: 'Audit Archive', subtitle: 'The historical record of every audit conducted, all years' },
  '/rules-universe': { title: 'Rules Universe', subtitle: 'Compliance rules and thresholds, reusable across audits' },
  '/calendar': { title: 'Audit Calendar', subtitle: 'Annual planning view of scheduled audits' },
  '/audits': { title: 'Audits', subtitle: 'Schedule and manage audit engagements' },
  '/my-actions': { title: 'My Assigned Items', subtitle: 'Non-compliant observations assigned to you for remediation' },
  '/team-tasks': { title: 'Team Task Sheets', subtitle: 'Every work-program task, organized by who it is assigned to' },
  '/copilot': { title: 'AuditBrain Copilot', subtitle: 'Ask natural-language questions about org data' },
  '/reports': { title: 'Reports', subtitle: 'Generate a standard-format Excel audit report' },
};

export default function Shell({ children }) {
  const pathname = usePathname();
  const isAuditDetail = pathname.startsWith('/audits/');
  const top = isAuditDetail ? { title: 'Audit Engagement', subtitle: 'Work program, evidence, rules, AI assessment & remediation' } : (TOPBAR[pathname] || { title: 'AegisAudit AI', subtitle: '' });
  const { name, title, kind, setIdentity, ready } = useIdentity();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">MP</div>
          <div className="logo">AegisAudit AI<span>Mankind Pharma Ltd. — Internal Audit</span></div>
        </div>
        <nav className="sidebar-nav">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href === '/audits' && isAuditDetail);
            return (
              <Link key={item.href} href={item.href} className={`nav-item${active ? ' active' : ''}`}>
                <div className="nav-icon"><Icon name={item.icon} /></div>
                <div className="nav-text">
                  <div className="t">{item.label}</div>
                  <div className="d">{item.desc}</div>
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="main">
        <header className="topbar">
          <div><h1>{top.title}</h1><p>{top.subtitle}</p></div>
          {ready && (
            <div className="identity-switcher">
              <span className="identity-label">Signed in as</span>
              <select value={name} onChange={(e) => setIdentity(e.target.value)}>
                {ALL_PEOPLE.map((p) => <option key={p.name} value={p.name}>{p.name} — {p.title}</option>)}
              </select>
              <span className={`badge ${kind === 'Auditor' ? 'badge-purple' : 'badge-blue'}`}>{kind}</span>
            </div>
          )}
        </header>
        <main className="content">{children}</main>
      </div>
      {pathname !== '/copilot' && (
        <Link href="/copilot" className="copilot-fab" title="Ask AuditBrain">
          <Icon name="file-text" />
        </Link>
      )}
    </div>
  );
}
