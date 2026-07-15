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
 * @returns {{ role: 'advocate'|'user'|null, advocate: object|null, user: object|null, account: object|null, loading: boolean }}
 */
export function useAuth() {
  const pathname = usePathname();
  const [session, setSession] = useState({ role: null, advocate: null, user: null });
  const [loading, setLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const data = res.ok ? await res.json() : { role: null, advocate: null, user: null };
      setSession({
        role: data.role || null,
        advocate: data.advocate || null,
        user: data.user || null,
      });
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
