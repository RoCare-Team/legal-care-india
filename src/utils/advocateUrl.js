/**
 * Lawyer public-profile URL helpers.
 *
 * Profile URLs combine an SEO slug with the permanent Justiceland ID:
 *   /lawyers/manoj-sharma-jusld07
 * The `jusldNN` suffix is the stable identifier — the slug is cosmetic, so
 * the profile keeps working even if the lawyer later changes their name.
 *
 * Profiles created before the sequential scheme carry a random `LCI-XXXXXX`
 * id, and those URLs are already indexed and shared. Both forms are parsed
 * here; the page then 308-redirects the old one to the canonical new URL, so
 * nothing 404s and search engines are told where the page moved.
 */

/**
 * Build the canonical profile path segment for a lawyer.
 *
 * Lower-case in the URL — `…-jusld04` — even though the profile badge shows
 * JUSLD04. The whole path is lower-case, and a single mixed-case fragment in
 * the middle of it reads like a typo. Both parsers below are case-insensitive
 * and the page redirects anything non-canonical, so an upper-case link still
 * lands in the right place.
 */
export function advocateProfilePath(advocate) {
  if (advocate?.legalCareId) {
    return `${advocate.slug}-${advocate.legalCareId.toLowerCase()}`;
  }
  return advocate?.slug || '';
}

/** Current form: `…-jusld07`. */
const CURRENT = /-(jusld\d+)$/i;
/** Retired form: `…-lci-8kq9pm`. */
const LEGACY = /-lci-([0-9a-z]{6})$/i;

/**
 * Parse a `[slug]` route param into its Justiceland ID + slug portion.
 *
 * Returns `{ legalCareId, legacyLegalCareId, slug }`. Exactly one of the two
 * id fields is set; both are null for a bare slug-only legacy URL.
 */
export function parseAdvocateParam(param = '') {
  const value = String(param);

  const current = value.match(CURRENT);
  if (current) {
    return {
      legalCareId: current[1].toUpperCase(),
      legacyLegalCareId: null,
      slug: value.slice(0, current.index),
    };
  }

  const legacy = value.match(LEGACY);
  if (legacy) {
    return {
      legalCareId: null,
      legacyLegalCareId: `LCI-${legacy[1].toUpperCase()}`,
      slug: value.slice(0, legacy.index),
    };
  }

  return { legalCareId: null, legacyLegalCareId: null, slug: value };
}
