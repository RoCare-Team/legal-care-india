/**
 * A tiny cross-component signal for "the session data changed — re-read it".
 *
 * `useAuth` runs independently in the header, mobile menu, profile actions etc.
 * When something mutates the session (e.g. a wallet top-up or a consultation
 * charge), call `refreshAuth()` and every `useAuth` consumer re-fetches, so the
 * navbar balance updates instantly instead of waiting for a page refresh.
 */
export const AUTH_REFRESH_EVENT = 'lci:auth-refresh';

/** Ask every `useAuth` consumer to re-fetch the current session. */
export function refreshAuth() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(AUTH_REFRESH_EVENT));
}
