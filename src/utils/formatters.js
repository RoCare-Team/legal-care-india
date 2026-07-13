/**
 * Small, pure formatting helpers reused across the UI.
 */

/**
 * Compact a large number, e.g. 12500 -> "12.5K", 2100000 -> "2.1M".
 * @param {number} value
 * @returns {string}
 */
export function formatCompactNumber(value = 0) {
  return new Intl.NumberFormat('en-IN', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * Format a rating to a single decimal place, e.g. 4 -> "4.0".
 * @param {number} rating
 * @returns {string}
 */
export function formatRating(rating = 0) {
  return Number(rating).toFixed(1);
}

/**
 * Pluralize a noun based on a count.
 * @param {number} count
 * @param {string} singular
 * @param {string} [plural]
 * @returns {string}
 */
export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

/**
 * Format years of experience into a human label.
 * @param {number} years
 * @returns {string}
 */
export function formatExperience(years = 0) {
  return `${years}+ ${years === 1 ? 'year' : 'years'} experience`;
}

/**
 * Format an ISO date string as "12 Jul 2026" (stable, locale-independent).
 * @param {string|Date} value
 * @returns {string}
 */
export function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
