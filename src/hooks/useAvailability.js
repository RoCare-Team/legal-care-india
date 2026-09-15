'use client';

import { useCallback, useEffect, useState } from 'react';

const EVENT = 'jl:availability';

function broadcast(value) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: Boolean(value) }));
}

/**
 * The lawyer's online/offline switch, shared across every control on the
 * dashboard that shows or flips it — the topbar toggle, the "You are live"
 * banner and the stay-online band. Each mounts with the server's value; a flip
 * anywhere is broadcast on `window` so the others follow without a reload.
 *
 * Saves immediately (PATCH /api/dashboard/profile), optimistically, and puts
 * the old value back everywhere if the save fails.
 *
 * @param {boolean} [initialAvailable=false]
 */
export function useAvailability(initialAvailable = false) {
  const [available, setLocal] = useState(Boolean(initialAvailable));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onChange = (e) => setLocal(Boolean(e.detail));
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);

  const setAvailable = useCallback(async (next) => {
    setSaving(true);
    broadcast(next);
    try {
      const res = await fetch('/api/dashboard/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: next }),
      });
      if (!res.ok) broadcast(!next);
    } catch {
      broadcast(!next);
    } finally {
      setSaving(false);
    }
  }, []);

  return { available, saving, setAvailable };
}
