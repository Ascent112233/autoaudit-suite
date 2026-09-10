'use client';

import { useState, useEffect, useCallback } from 'react';
import { AUDIT_TEAM } from './mankindData';
import { DEPARTMENT_HEADS } from './auditData';

export const ALL_PEOPLE = [
  ...AUDIT_TEAM.map((p) => ({ name: p.name, title: p.role, kind: 'Auditor' })),
  ...DEPARTMENT_HEADS.map((p) => ({ name: p.name, title: p.dept, kind: 'Dept Head' })),
];

const STORAGE_KEY = 'aegis_identity';
const DEFAULT_NAME = AUDIT_TEAM[0].name;

export function useIdentity() {
  const [name, setName] = useState(DEFAULT_NAME);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setName(saved);
    } catch (e) {}
    setReady(true);
  }, []);

  const setIdentity = useCallback((n) => {
    setName(n);
    try { window.localStorage.setItem(STORAGE_KEY, n); } catch (e) {}
  }, []);

  const person = ALL_PEOPLE.find((p) => p.name === name) || ALL_PEOPLE[0];
  return { name: person.name, title: person.title, kind: person.kind, isAuditTeam: person.kind === 'Auditor', isDeptHead: person.kind === 'Dept Head', setIdentity, ready };
}
