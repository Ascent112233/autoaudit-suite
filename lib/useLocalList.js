'use client';

import { useState, useEffect, useCallback } from 'react';

export function useLocalList(key, seed) {
  const [items, setItems] = useState(seed);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) setItems(JSON.parse(raw));
    } catch (e) {}
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem(key, JSON.stringify(items)); } catch (e) {}
  }, [items, ready, key]);

  const addItem = useCallback((item) => setItems((prev) => [item, ...prev]), []);
  const updateItem = useCallback(
    (id, patch) => setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...(typeof patch === 'function' ? patch(i) : patch) } : i))),
    []
  );

  return { items, setItems, addItem, updateItem, ready };
}
