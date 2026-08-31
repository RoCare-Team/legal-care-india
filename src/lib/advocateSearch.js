import { servesCity } from '@/utils/advocateCity';

/**
 * The directory's filter and sort rules, in one place.
 *
 * The website filters the lawyer list in the browser (see AdvocateListing) and
 * the mobile app asks the server for it (GET /api/advocates). Those are two
 * clients of the same directory, and when each carried its own copy of "what
 * counts as a match" they answered the same search differently — one searched
 * the courts a lawyer practises in and the other did not, one read "most
 * relevant" as rating × reviews and the other as newest first.
 *
 * So the rules live here and both call them. Anything that has to know where
 * the caller is running stays out: live availability is the browser's presence
 * poll on the web and a live read on the server, and neither belongs in a pure
 * function over a list.
 */

/** Sort orders the directory offers, in the order the filter bar lists them. */
export const ADVOCATE_SORTS = ['relevance', 'rating', 'experience', 'fee-low', 'fee-high'];

/**
 * Does one lawyer match a set of filters?
 *
 * Free text is matched against the lawyer's name, their tagline, the legal
 * services they list and the courts they appear in — so "supreme court" finds
 * the people who practise there, which is how someone with a matter in one
 * actually searches.
 *
 * @param {object} advocate
 * @param {{query?:string, service?:string, subService?:string, court?:string, city?:string}} filters
 * @returns {boolean}
 */
export function matchesAdvocate(advocate, filters = {}) {
  const q = String(filters.query || '').trim().toLowerCase();
  if (q) {
    const hit =
      advocate.name?.toLowerCase().includes(q) ||
      advocate.tagline?.toLowerCase().includes(q) ||
      advocate.specializations?.some((s) => s.toLowerCase().includes(q)) ||
      advocate.courts?.some((c) => c.toLowerCase().includes(q));
    if (!hit) return false;
  }

  if (filters.service && !advocate.specializations?.includes(filters.service)) return false;
  if (filters.subService && !advocate.subSpecializations?.includes(filters.subService)) {
    return false;
  }
  if (filters.court && !advocate.courts?.includes(filters.court)) return false;

  // Base city or any city they also work in — `servesCity` is the one rule the
  // city pages use too, so the directory and /bengaluru never disagree about
  // who belongs to a city.
  return servesCity(advocate, String(filters.city || '').trim());
}

/** Every lawyer in `list` that matches. Never mutates the input. */
export function filterAdvocates(list, filters = {}) {
  return list.filter((a) => matchesAdvocate(a, filters));
}

/**
 * Order a copy of the list.
 *
 * "Relevance" is rating × reviews: a lawyer with 4.9 from forty clients is a
 * better answer than one with a lone five-star review, and sorting on the
 * average alone puts them the other way round.
 *
 * @param {Array} list
 * @param {string} sort  one of ADVOCATE_SORTS
 */
export function sortAdvocates(list, sort) {
  const copy = [...list];
  switch (sort) {
    case 'rating':
      return copy.sort((a, b) => b.rating - a.rating);
    case 'experience':
      return copy.sort((a, b) => b.experience - a.experience);
    case 'fee-low':
      return copy.sort((a, b) => a.consultationFee - b.consultationFee);
    case 'fee-high':
      return copy.sort((a, b) => b.consultationFee - a.consultationFee);
    default:
      return copy.sort((a, b) => b.rating * b.reviews - a.rating * a.reviews);
  }
}
