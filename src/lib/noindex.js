/**
 * Site-wide search-engine kill switch.
 *
 * While the site is still being built we do not want half-finished pages or
 * test profiles landing in Google — once indexed they take weeks to remove.
 * Set `SITE_NOINDEX=true` in the environment and every crawler signal flips
 * off together:
 *
 *   - the `robots` meta tag on every page  (src/lib/metadata.js)
 *   - /robots.txt                          (src/app/robots.js)
 *   - /sitemap.xml                         (src/app/sitemap.js)
 *
 * All three matter: different crawlers weight them differently, so changing
 * only one leaves the site partly indexable.
 *
 * Set it to `false` (or remove it) on launch day — no code change needed.
 * Server-only: never read this from a Client Component, where the variable
 * is not available and would silently read as `false`.
 */
export const NOINDEX = process.env.SITE_NOINDEX === 'true';
