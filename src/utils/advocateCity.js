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
 * registration form and stored as typed.
 */
export function servesCity(advocate, cityName) {
  if (!cityName) return true;
  const target = String(cityName).trim().toLowerCase();
  if (!target) return true;

  if (String(advocate?.city || '').trim().toLowerCase() === target) return true;

  return (advocate?.practiceCities || []).some(
    (c) => String(c || '').trim().toLowerCase() === target
  );
}
