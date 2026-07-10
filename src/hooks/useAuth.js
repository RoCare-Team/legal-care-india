'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

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
 * @returns {{ role: 'advocate'|'user'|null, advocate: object|null, user: object|null, account: object|null, loading: boolean }}
 */
export function useAuth() {
  const pathname = usePathname();
  const [session, setSession] = useState({ role: null, advocate: null, user: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : { role: null, advocate: null, user: null }))
      .then((data) => {
        if (active) {
          setSession({
            role: data.role || null,
            advocate: data.advocate || null,
            user: data.user || null,
          });
        }
      })
      .catch(() => {
        if (active) setSession({ role: null, advocate: null, user: null });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [pathname]);

  return {
    role: session.role,
    advocate: session.advocate,
    user: session.user,
    account: session.advocate || session.user,
    loading,
  };
}
