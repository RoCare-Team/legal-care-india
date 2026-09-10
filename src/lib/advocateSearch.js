import { servesCity } from '@/utils/advocateCity';
import { activePlan } from '@/constants/membershipPlans';

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
 * The last four narrow by things only a phone's filter screen currently asks
 * for — a language, a floor on experience, a ceiling on the per-minute rate,
 * and verified-only. The website's filter bar does not offer them, and because
 * an absent filter is a no-op, adding them here changes nothing about how
 * /lawyers behaves. They live here rather than in the API route so that the day
 * the web bar does offer them, both clients already agree on what they mean.
 *
 * @param {object} advocate
 * @param {{query?:string, service?:string, subService?:string, court?:string,
 *          city?:string, language?:string, minExperience?:number,
 *          maxFee?:number, verifiedOnly?:boolean}} filters
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
  if (filters.language && !advocate.languages?.includes(filters.language)) return false;

  if (filters.verifiedOnly && !advocate.verified) return false;

  const minExperience = Number(filters.minExperience) || 0;
  if (minExperience > 0 && (Number(advocate.experience) || 0) < minExperience) return false;

  // A ceiling on the rate is a ceiling on the cheapest way to reach them, which
  // is the figure their card quotes. A lawyer who has published no live rate at
  // all has no price to compare, so a price filter cannot keep them: they are
  // someone you have to ask, not someone who is cheap.
  const maxFee = Number(filters.maxFee) || 0;
  if (maxFee > 0) {
    const rate = cheapestRate(advocate);
    if (rate === null || rate > maxFee) return false;
  }

  // Base city or any city they also work in — `servesCity` is the one rule the
  // city pages use too, so the directory and /bengaluru never disagree about
  // who belongs to a city.
  return servesCity(advocate, String(filters.city || '').trim());
}

/**
 * The lowest per-minute rate a lawyer actually offers, or null when they offer
 * no live channel at all. This is the number their card leads with.
 */
export function cheapestRate(advocate) {
  const rates = [advocate?.chatRate, advocate?.audioRate, advocate?.videoRate]
    .map((r) => Number(r) || 0)
    .filter((r) => r > 0);
  return rates.length ? Math.min(...rates) : null;
}

/** Every lawyer in `list` that matches. Never mutates the input. */
export function filterAdvocates(list, filters = {}) {
  return list.filter((a) => matchesAdvocate(a, filters));
}

/**
 * Where a lawyer's membership puts them: Premium above Professional above
 * Starter. Read through `activePlan`, so a lapsed membership ranks as Starter
 * from the moment it lapses.
 */
export function planRank(advocate) {
  return activePlan(advocate).rank;
}

/**
 * Order a copy of the list.
 *
 * Membership comes first, always: Premium above Professional above Starter,
 * which is the order of what they cost. That is what the plan is sold on, and
 * a placement that only held on the default view is not the placement a lawyer
 * paid ₹499 for.
 *
 * The chosen sort then orders lawyers *within* each tier. So "Highest rated"
 * gives the best-rated Premium lawyers, then the best-rated Professional ones,
 * then the best-rated free ones — every tier sorted as asked, the tiers
 * themselves in paid order.
 *
 * The cost of this is worth stating plainly: "Rate: low to high" no longer
 * returns the cheapest lawyer first if a dearer one has paid for placement.
 * The control still sorts, but it sorts inside a group the visitor cannot see.
 *
 * "Relevance" is rating × reviews: a lawyer with 4.9 from forty clients is a
 * better answer than one with a lone five-star review, and sorting on the
 * average alone puts them the other way round.
 *
 * @param {Array} list
 * @param {string} sort  one of ADVOCATE_SORTS
 */
export function sortAdvocates(list, sort) {
  // Within a tier. Returns 0 for "these two are equally good by this sort",
  // which leaves their existing order alone.
  const within = (a, b) => {
    switch (sort) {
      case 'rating':
        return b.rating - a.rating;
      case 'experience':
        return b.experience - a.experience;
      case 'fee-low':
        return a.consultationFee - b.consultationFee;
      case 'fee-high':
        return b.consultationFee - a.consultationFee;
      default:
        return b.rating * b.reviews - a.rating * a.reviews;
    }
  };

  return [...list].sort((a, b) => planRank(b) - planRank(a) || within(a, b));
}
