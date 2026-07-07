'use client';

import { useEffect, useState } from 'react';

/**
 * useAuth — reads the current session from /api/auth/me on the client.
 * Lets layout components (Header, MobileMenu) react to login state without
 * threading server data through every page.
 *
 * @returns {{ advocate: object|null, loading: boolean }}
 */
export function useAuth() {
  const [advocate, setAdvocate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : { advocate: null }))
      .then((data) => {
        if (active) setAdvocate(data.advocate || null);
      })
      .catch(() => {
        if (active) setAdvocate(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { advocate, loading };
}
