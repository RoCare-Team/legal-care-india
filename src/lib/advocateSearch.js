import { servesCity } from '@/utils/advocateCity';
import { activePlan } from '@/constants/membershipPlans';
import { getSubServices } from '@/data/categories';

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
 * How squarely a lawyer belongs to a practice area or a matter, as a comparator
 * — negative when `a` is the better fit, positive when `b` is.
 *
 * Nearly every lawyer here ticks several areas: Criminal Law is on 351 of 391
 * profiles and Family Law on 353. Filtering alone therefore gave every category
 * page almost the same list, and ordered newest-first it gave them literally
 * the same top six — the Criminal Law and Family Law pages opened on the same
 * people. What tells a criminal lawyer from a lawyer who also ticked Criminal
 * Law is what else they chose:
 *
 *  - for a practice area, the share of their specific matters that belong to
 *    it — ten criminal matters out of ten is a criminal lawyer, three out of
 *    forty is not — then the fewer areas overall, then the more matters in it;
 *  - for a single matter, the fewer areas and then the fewer matters overall,
 *    since everyone in that list has the matter and the question is who has
 *    little else.
 *
 * The order of `specializations` is not used: it follows the order of the
 * registration form's checkboxes, not the lawyer's own emphasis, which is why
 * Civil Law is "first" on 236 profiles.
 *
 * @param {{service?: string, subService?: string}} [context]
 * @returns {(a: object, b: object) => number}
 */
export function bySpecialism({ service, subService } = {}) {
  if (subService) {
    return (a, b) =>
      (a.specializations?.length || 0) - (b.specializations?.length || 0) ||
      (a.subSpecializations?.length || 0) - (b.subSpecializations?.length || 0);
  }
  if (service) {
    const matters = new Set(getSubServices(service));
    const fit = (x) => {
      const subs = x.subSpecializations || [];
      const inArea = subs.filter((s) => matters.has(s)).length;
      return { share: subs.length ? inArea / subs.length : 0, inArea, areas: x.specializations?.length || 0 };
    };
    return (a, b) => {
      const A = fit(a);
      const B = fit(b);
      return B.share - A.share || A.areas - B.areas || B.inArea - A.inArea;
    };
  }
  return () => 0;
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
 * average alone puts them the other way round. When the list is narrowed to a
 * practice area or a matter, relevance first means fit — see `bySpecialism` —
 * and rating × reviews then breaks ties.
 *
 * @param {Array} list
 * @param {string} sort  one of ADVOCATE_SORTS
 * @param {{service?: string, subService?: string}} [context]  what the list is narrowed to
 */
export function sortAdvocates(list, sort, context = {}) {
  const specialism = bySpecialism(context);
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
        return specialism(a, b) || b.rating * b.reviews - a.rating * a.reviews;
    }
  };

  return [...list].sort((a, b) => planRank(b) - planRank(a) || within(a, b));
}
