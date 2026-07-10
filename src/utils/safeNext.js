/**
 * Read a safe post-auth redirect target from the current URL's `next` param.
 * Only same-site absolute paths are allowed (must start with a single "/"),
 * which prevents open-redirects to external sites. Falls back to `fallback`.
 *
 * Client-only (reads window.location).
 *
 * @param {string} [fallback='/account']
 * @returns {string}
 */
export function safeNextPath(fallback = '/account') {
  if (typeof window === 'undefined') return fallback;
  const next = new URLSearchParams(window.location.search).get('next');
  if (next && next.startsWith('/') && !next.startsWith('//')) return next;
  return fallback;
}
