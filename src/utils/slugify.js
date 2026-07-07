/**
 * Convert an arbitrary string into a URL-safe slug.
 *
 * @param {string} value
 * @returns {string}
 */
export function slugify(value = '') {
  return value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
