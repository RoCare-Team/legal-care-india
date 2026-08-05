'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AUTH_REFRESH_EVENT } from '@/utils/authEvents';

/**
 * useAuth — reads the current session from /api/auth/me on the client.
 * Lets layout components (Header, MobileMenu) react to login state without
 * threading server data through every page.
 *
 * Re-fetches on every route change so the navbar reflects the real session
 * after a client-side navigation (e.g. right after registering, when the
 * cookie is set but the header hasn't reloaded). The current session is kept
 * while re-fetching, so there's no logged-out flash between pages.
 *
 * Also re-fetches whenever `refreshAuth()` fires (see utils/authEvents) — used
 * after a wallet top-up or a consultation charge so the balance in the navbar
 * updates immediately, without a page refresh.
 *
 * The last known role is remembered in localStorage and applied the instant
 * this mounts, before the fetch has been anywhere. Every page on the site is
 * statically rendered, so the server has no idea who is asking and the header
 * would otherwise sit blank for a whole network round trip — long enough on a
 * real connection that the account buttons look like they arrive late. The
 * remembered role is a guess, corrected a moment later by the fetch, which is
 * the only thing that actually decides.
 *
 * @returns {{ role: 'advocate'|'user'|null, advocate: object|null, user: object|null, account: object|null, loading: boolean }}
 */
const ROLE_KEY = 'lci:last-role';

/** Keep (or clear) the role this browser last saw, for the next first paint. */
function remember(role) {
  try {
    if (role) window.localStorage.setItem(ROLE_KEY, role);
    else window.localStorage.removeItem(ROLE_KEY);
  } catch {
    // Nothing to do — the guess is an optimisation, not a requirement.
  }
}

export function useAuth() {
  const pathname = usePathname();
  const [session, setSession] = useState({ role: null, advocate: null, user: null });
  const [loading, setLoading] = useState(true);

  // Applied after hydration, never during render: reading storage while
  // rendering would make the first client pass disagree with the server's HTML.
  useEffect(() => {
    try {
      const remembered = window.localStorage.getItem(ROLE_KEY);
      if (remembered === 'user' || remembered === 'advocate') {
        setSession((prev) => (prev.role ? prev : { ...prev, role: remembered }));
      }
    } catch {
      // Storage can be unavailable (private mode); the fetch still resolves it.
    }
  }, []);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const data = res.ok ? await res.json() : { role: null, advocate: null, user: null };
      setSession({
        role: data.role || null,
        advocate: data.advocate || null,
        user: data.user || null,
      });
      remember(data.role || null);
    } catch {
      setSession({ role: null, advocate: null, user: null });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [pathname, fetchSession]);

  useEffect(() => {
    window.addEventListener(AUTH_REFRESH_EVENT, fetchSession);
    return () => window.removeEventListener(AUTH_REFRESH_EVENT, fetchSession);
  }, [fetchSession]);

  return {
    role: session.role,
    advocate: session.advocate,
    user: session.user,
    account: session.advocate || session.user,
    loading,
  };
}
