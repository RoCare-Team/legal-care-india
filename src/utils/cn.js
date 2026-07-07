/**
 * Lightweight className combiner.
 * Filters out falsy values so conditional classes stay readable.
 *
 * @param {...(string|false|null|undefined)} classes
 * @returns {string}
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
