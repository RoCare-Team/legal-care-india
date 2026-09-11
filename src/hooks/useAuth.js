'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { AUTH_REFRESH_EVENT } from '@/utils/authEvents';

/**
 * useAuth — reads the current session from /api/auth/me on the client.
 * Lets layout components (Header, MobileMenu) react to login state without
 * threading server data through every page.
 *
 * One session for the whole tab, fetched once. This hook is used by the header,
 * the mobile menu, and every lawyer card's Call / Chat / Video buttons — and it
 * used to fetch per use. The home page asked /api/auth/me 39 times on load and
 * /lawyers 15 times, every one of them the same question with the same answer.
 * A browser runs about six requests to a host at once, so those 39 queued
 * ahead of the lawyers' photographs, which took five or six seconds to appear.
 * Now every caller subscribes to one shared store, and there is at most one
 * request in flight however many components ask.
 *
 * Re-fetches once per route change, so the navbar reflects the real session
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

/** What the server renders and the first client pass matches. */
const INITIAL = Object.freeze({ role: null, advocate: null, user: null, loading: true });

const store = {
  snapshot: INITIAL,
  listeners: new Set(),
  inflight: null,
  // The route the session was last read for, so twenty components mounting on
  // one page do not each count as a navigation.
  fetchedFor: null,
  rememberedApplied: false,
  refreshListening: false,
};

function publish(next) {
  store.snapshot = next;
  store.listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  store.listeners.add(listener);
  return () => store.listeners.delete(listener);
}

const getSnapshot = () => store.snapshot;
const getServerSnapshot = () => INITIAL;

/**
 * Read the session. Joins the request already in flight instead of starting
 * another — unless `fresh`, for a refresh after something changed (a wallet
 * top-up): a request that left before the change could return the old balance,
 * so a fresh read waits for it and then asks again.
 */
function loadSession({ fresh = false } = {}) {
  if (store.inflight) {
    return fresh ? store.inflight.then(() => loadSession()) : store.inflight;
  }
  store.inflight = (async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const data = res.ok ? await res.json() : {};
      publish({
        role: data.role || null,
        advocate: data.advocate || null,
        user: data.user || null,
        loading: false,
      });
      remember(data.role || null);
    } catch {
      publish({ role: null, advocate: null, user: null, loading: false });
    } finally {
      store.inflight = null;
    }
  })();
  return store.inflight;
}

export function useAuth() {
  const pathname = usePathname();
  const session = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Applied after hydration, never during render: reading storage while
  // rendering would make the first client pass disagree with the server's HTML.
  // Once per tab, not once per component.
  useEffect(() => {
    if (store.rememberedApplied) return;
    store.rememberedApplied = true;
    try {
      const remembered = window.localStorage.getItem(ROLE_KEY);
      if ((remembered === 'user' || remembered === 'advocate') && !store.snapshot.role) {
        publish({ ...store.snapshot, role: remembered });
      }
    } catch {
      // Storage can be unavailable (private mode); the fetch still resolves it.
    }
  }, []);

  // One read per route, however many components on it use this hook.
  useEffect(() => {
    if (store.fetchedFor === pathname) return;
    store.fetchedFor = pathname;
    loadSession();
  }, [pathname]);

  // One listener for the tab, not one per component.
  useEffect(() => {
    if (store.refreshListening) return;
    store.refreshListening = true;
    window.addEventListener(AUTH_REFRESH_EVENT, () => loadSession({ fresh: true }));
  }, []);

  return {
    role: session.role,
    advocate: session.advocate,
    user: session.user,
    account: session.advocate || session.user,
    loading: session.loading,
  };
}
