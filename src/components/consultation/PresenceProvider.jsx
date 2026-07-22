'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';

/**
 * PresenceProvider — polls /api/presence and shares the set of online lawyer
 * ids app-wide, so any card/profile badge can reflect live online/offline
 * status without a page refresh. Mounted once at the app root.
 */
const PresenceContext = createContext(null);

const POLL_MS = 8000;

export default function PresenceProvider({ children }) {
  // `null` until the first fetch resolves — lets badges fall back to their
  // server-rendered value instead of flashing "offline" on load.
  const [online, setOnline] = useState(null);
  const timer = useRef(null);

  useEffect(() => {
    let alive = true;

    const tick = async () => {
      // Skip while the tab is hidden — no point polling in the background.
      if (document.visibilityState === 'hidden') return;
      try {
        const res = await fetch('/api/presence', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (alive) setOnline(new Set(data.online || []));
      } catch {
        /* ignore transient errors — keep the last known state */
      }
    };

    tick();
    timer.current = setInterval(tick, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      alive = false;
      clearInterval(timer.current);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return <PresenceContext.Provider value={online}>{children}</PresenceContext.Provider>;
}

/**
 * usePresence() — the whole set of online lawyer ids, or `null` until the first
 * poll lands. The directory needs this to filter a list; a card that only cares
 * about itself should use `useIsOnline` below.
 */
export function usePresence() {
  return useContext(PresenceContext);
}

/**
 * useIsOnline(id, fallback) — live online status for one lawyer.
 * Until the first poll lands (`online === null`) it returns the server-rendered
 * `fallback` so nothing flickers.
 */
export function useIsOnline(id, fallback = false) {
  const online = useContext(PresenceContext);
  if (online === null) return fallback;
  return id ? online.has(String(id)) : fallback;
}
