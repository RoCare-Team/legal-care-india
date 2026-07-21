/**
 * Lawyer public-profile URL helpers.
 *
 * Profile URLs combine an SEO slug with the permanent Legal Care India ID:
 *   /lawyers/manoj-sharma-lci-8kq9pm
 * The `lci-xxxxxx` suffix is the stable identifier — the slug is cosmetic, so
 * the profile keeps working even if the lawyer later changes their name.
 */

/** Build the canonical profile path segment for a lawyer. */
export function advocateProfilePath(advocate) {
  if (advocate?.legalCareId) {
    return `${advocate.slug}-${advocate.legalCareId.toLowerCase()}`;
  }
  return advocate?.slug || '';
}

/**
 * Parse a `[slug]` route param into its Legal Care India ID + slug portion.
 * Returns `{ legalCareId: null }` for legacy slug-only URLs.
 */
export function parseAdvocateParam(param = '') {
  const match = String(param).match(/-lci-([0-9a-z]{6})$/i);
  if (match) {
    return {
      legalCareId: `LCI-${match[1].toUpperCase()}`,
      slug: param.slice(0, match.index),
    };
  }
  return { legalCareId: null, slug: param };
}
