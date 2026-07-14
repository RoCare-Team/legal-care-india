'use client';

import { useEffect, useState, useCallback } from 'react';

/**
 * useSessionPoll — polls a consultation session by id at a fixed interval and
 * returns its latest state. Returns [session, setSession, refresh].
 *
 * @param {string|null} id
 * @param {{ enabled?: boolean, interval?: number }} [opts]
 */
export function useSessionPoll(id, { enabled = true, interval = 2000 } = {}) {
  const [session, setSession] = useState(null);

  const refresh = useCallback(async () => {
    if (!id) return null;
    try {
      const res = await fetch(`/api/consultations/${id}`, { cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();
      setSession(data.session);
      return data.session;
    } catch {
      return null;
    }
  }, [id]);

  useEffect(() => {
    // No session to track — drop any stale state so consumers don't render it.
    if (!id) {
      setSession(null);
      return undefined;
    }
    if (!enabled) return undefined;
    let active = true;
    const tick = async () => {
      if (active) await refresh();
    };
    tick();
    const t = setInterval(tick, interval);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [id, enabled, interval, refresh]);

  return [session, setSession, refresh];
}
