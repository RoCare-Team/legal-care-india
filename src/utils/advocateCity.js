import { aliasesOf } from '@/utils/cityAliases';

/**
 * Does a lawyer serve a given city?
 *
 * A lawyer has a base city and a list of other cities they take cases in
 * ("Cities You Work In" on their profile). Both count: an advocate based in
 * Lucknow who also appears in Kanpur court belongs on the Kanpur page, and
 * saying otherwise makes the feature pointless — the lawyer filled that list
 * in precisely so clients in those cities would find them.
 *
 * Compared case-insensitively, because city names are typed by hand in the
 * registration form and stored as typed — and by every name the city goes by,
 * so a lawyer who wrote "Gurgaon" is on the Gurugram page too.
 */
export function servesCity(advocate, cityName) {
  if (!cityName) return true;
  const targets = aliasesOf(cityName);
  if (!targets.length) return true;

  const matches = (c) => targets.includes(String(c || '').trim().toLowerCase());
  return matches(advocate?.city) || (advocate?.practiceCities || []).some(matches);
}
