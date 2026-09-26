import { getAllAdvocates } from '@/lib/advocates';
import { getAllCities } from '@/lib/cities';
import { toCardAdvocate } from '@/lib/advocateCard';
import { cheapestRate, planRank } from '@/lib/advocateSearch';
import { servesCity } from '@/utils/advocateCity';
import { MAX_RESULTS } from '@/constants/voiceSearch';

/**
 * Finding the lawyers, once the problem has been understood.
 *
 * This is ordinary database work, on purpose. The AI upstream has already said
 * "Labour & Employment / Wage Disputes / Gurgaon"; from here on it is the
 * directory's own filters and a score anyone can read, so the same spoken
 * problem always returns the same lawyers and every result can be explained in
 * a sentence the visitor is actually shown.
 *
 * There is no vector search here and none is needed: a lawyer's areas and
 * matters are a fixed vocabulary that the intent has already been mapped onto,
 * so matching is exact rather than approximate. If free-text profiles are ever
 * ranked semantically, it belongs as a layer *after* this one — filter first,
 * then re-rank what survived.
 */

/**
 * Cities Indians call by two names.
 *
 * The directory has a page for "Gurugram"; the person speaking says "Gurgaon";
 * and the lawyer typed whichever of the two they think of their own office as
 * being in. All three have to find each other or a perfectly good search for a
 * labour lawyer in Gurgaon returns nobody — which is exactly what it did
 * before this table existed.
 */
const CITY_ALIASES = [
  ['gurugram', 'gurgaon'],
  ['bengaluru', 'bangalore'],
  ['mumbai', 'bombay'],
  ['kolkata', 'calcutta'],
  ['chennai', 'madras'],
  ['pune', 'poona'],
  ['mysuru', 'mysore'],
  ['vadodara', 'baroda'],
  ['thiruvananthapuram', 'trivandrum'],
  ['kochi', 'cochin'],
  ['puducherry', 'pondicherry'],
  ['prayagraj', 'allahabad'],
  ['varanasi', 'banaras', 'benares'],
  ['shimla', 'simla'],
  ['guwahati', 'gauhati'],
  ['indore', 'indhore'],
  ['noida', 'gautam buddha nagar'],
  ['navi mumbai', 'new bombay'],
];

/** Every name one city is known by, lowercase. */
function aliasesOf(name) {
  const want = String(name || '').trim().toLowerCase();
  if (!want) return [];
  const row = CITY_ALIASES.find((names) => names.includes(want));
  return row ? [...row] : [want];
}

/** How the list is widened when a narrow search finds nobody. */
const TIERS = [
  { key: 'exact', category: true, matter: true, city: true },
  { key: 'category-city', category: true, matter: false, city: true },
  { key: 'category', category: true, matter: false, city: false, relaxed: ['city'] },
  { key: 'city', category: false, matter: false, city: true, relaxed: ['category'] },
  { key: 'any', category: false, matter: false, city: false, relaxed: ['city', 'category'] },
];

/**
 * The narrowest search that finds anybody wins.
 *
 * It used to widen whenever a tier found fewer than a handful, which sounds
 * reasonable and is wrong: a search for a labour lawyer in Gurgaon that found
 * one in Gurgaon was thrown away in favour of three from anywhere in India —
 * and the screen then said "we could not find a match in Gurugram" directly
 * above a lawyer who practises there. One exact match beats three approximate
 * ones. The list is topped up from the wider tiers afterwards, below the
 * lawyers who actually match, and the screen says which it is doing.
 */

/**
 * The city the visitor named, as the directory knows it — or null.
 *
 * Matched on the name and the slug, then on a leading word, so "Gurgaon" finds
 * Gurgaon and "New Delhi" finds Delhi. Nothing is invented: a city we do not
 * have a page for returns null and the search simply runs nationally.
 */
export async function resolveCity(spoken) {
  const want = String(spoken || '').trim().toLowerCase();
  if (!want) return null;

  const cities = await getAllCities();
  const names = aliasesOf(want);

  const bySlug = cities.find((c) => names.includes(c.slug.replace(/-/g, ' ')) || c.slug === want.replace(/\s+/g, '-'));
  if (bySlug) return bySlug;

  const byName = cities.find((c) => names.includes((c.name || '').toLowerCase()));
  if (byName) return byName;

  return cities.find((c) => {
    const name = (c.name || '').toLowerCase();
    return name && (want.includes(name) || name.includes(want));
  }) || null;
}

/**
 * The names to search lawyer profiles by, for a city someone named.
 *
 * Deliberately more than the directory's own name for it. Lawyers type their
 * city by hand, so the list has to carry what the visitor said, what the
 * directory calls it, and the other name the place goes by — otherwise a
 * lawyer who wrote "Gurgaon" is invisible to a search for Gurugram and vice
 * versa.
 */
function citySearchNames(city, spoken) {
  const names = new Set();
  for (const source of [city?.name, spoken]) {
    for (const alias of aliasesOf(source)) names.add(alias);
  }
  return [...names].filter(Boolean);
}

/** Hindi came out of the transcript, so a lawyer who speaks it is a better fit. */
function wantedLanguage(intent) {
  return intent.language === 'hi' || intent.language === 'hinglish' ? 'Hindi' : '';
}

/**
 * How well one lawyer fits, and why.
 *
 * The weights say what matters in order: the right practice area first, then
 * the specific matter, then being reachable where the client is. Everything
 * after that separates lawyers who are all equally right for the problem —
 * verification, experience, the language they speak, whether they are taking
 * consultations at all.
 *
 * `reasons` is built from the same facts as the score, so the "why this
 * lawyer" line on the card can never say something the ranking did not use.
 */
function scoreAdvocate(advocate, { category, matter, cityNames, cityLabel, language, keywords }) {
  let points = 0;
  const reasons = [];

  const areas = advocate.specializations || [];
  const matters = advocate.subSpecializations || [];

  if (category && areas.includes(category)) {
    points += 50;
    reasons.push(`Practises ${category}`);
    // Someone whose practice is mostly this area, rather than one of nine
    // boxes they ticked, is the better answer to a question about it.
    if (areas.length <= 3) points += 8;
  }

  if (matter && matters.includes(matter)) {
    points += 30;
    reasons.push(`handles ${matter.toLowerCase()} cases`);
  }

  if (cityNames?.length && cityNames.some((n) => servesCity(advocate, n))) {
    points += 20;
    reasons.push(`is available in ${cityLabel}`);
  }

  if (advocate.verified) {
    points += 10;
    reasons.push('is verified by our team');
  }

  const years = Number(advocate.experience) || 0;
  points += Math.min(12, years / 2);
  if (years >= 5) reasons.push(`has ${years} years in practice`);

  if (language && (advocate.languages || []).includes(language)) {
    points += 6;
    reasons.push(`speaks ${language}`);
  }

  // Reachable right now beats a better profile that cannot take the call: the
  // whole promise of this directory is a consultation in ten minutes.
  if (advocate.available) points += 8;
  if (cheapestRate(advocate) !== null) points += 4;

  // A few keywords from the problem, matched against what the lawyer wrote
  // about themselves. Small weight on purpose — it is a tiebreaker, not a
  // claim about their practice.
  const blob = `${advocate.tagline || ''} ${(advocate.specializations || []).join(' ')} ${(advocate.subSpecializations || []).join(' ')}`.toLowerCase();
  const hits = (keywords || []).filter((k) => k.length > 3 && blob.includes(k)).length;
  points += Math.min(6, hits * 2);

  // Paid memberships lift a lawyer within an equally good set, exactly as they
  // do everywhere else in the directory — never past a better-matching one.
  points += planRank(advocate) * 2;

  const rating = Number(advocate.rating) || 0;
  if (rating > 0) points += Math.min(6, rating);

  return { points, reasons };
}

/** "Practises Labour & Employment, handles wage disputes and is verified." */
function reasonSentence(reasons) {
  const parts = reasons.slice(0, 3);
  if (!parts.length) return 'Available for a consultation on your matter.';
  if (parts.length === 1) return `${parts[0]}.`;
  const last = parts.pop();
  return `${parts.join(', ')} and ${last}.`;
}

/**
 * The lawyers for one understood problem.
 *
 * @param {object} intent   a validated intent (see lib/ai/legalIntent)
 * @param {object} [options]
 * @param {string} [options.cityOverride]  a city the visitor typed in answer to
 *                                         the follow-up question
 * @returns {Promise<{ lawyers: object[], city: object|null, relaxed: string[],
 *                     totalMatched: number }>}
 */
export async function findLawyersForIntent(intent, { cityOverride = '' } = {}) {
  const spokenCity = (cityOverride || intent.location || '').trim();
  const city = await resolveCity(spokenCity);
  // A city we have no page for is still a city a lawyer may have typed, so the
  // search runs on the name either way — only the label the screen shows
  // prefers the directory's spelling.
  const cityNames = citySearchNames(city, spokenCity);
  const cityLabel = city?.name || spokenCity;
  const category = intent.category || '';
  const matter = intent.matter || '';
  const language = wantedLanguage(intent);

  const all = await getAllAdvocates();

  let pool = [];
  let relaxed = [];
  // Every tier's results, in order, so the list can be topped up from the
  // wider ones once the precise ones have been shown.
  const widerPools = [];

  for (const tier of TIERS) {
    const wantCategory = tier.category ? category : '';
    const wantMatter = tier.matter ? matter : '';
    const wantCity = tier.city ? cityNames : [];

    // A tier that asks for something this problem does not have (no city was
    // named, no matter was recognised) is the tier above it — skip it rather
    // than run the same query twice.
    if ((tier.category && !category) || (tier.matter && !matter)
      || (tier.city && !cityNames.length)) continue;

    const found = all.filter((a) => {
      if (wantCategory && !(a.specializations || []).includes(wantCategory)) return false;
      if (wantMatter && !(a.subSpecializations || []).includes(wantMatter)) return false;
      if (wantCity.length && !wantCity.some((n) => servesCity(a, n))) return false;
      return true;
    });

    if (!found.length) continue;

    if (!pool.length) {
      pool = found;
      relaxed = tier.relaxed || [];
    } else {
      widerPools.push(found);
    }
  }

  // Enough exact matches to fill the page: nothing else is needed. Otherwise
  // the remainder comes from the wider tiers, and `toppedUp` says so.
  let toppedUp = false;
  if (pool.length < MAX_RESULTS) {
    const seen = new Set(pool.map((a) => String(a._id)));
    for (const wider of widerPools) {
      for (const advocate of wider) {
        if (pool.length >= MAX_RESULTS) break;
        const id = String(advocate._id);
        if (seen.has(id)) continue;
        seen.add(id);
        pool.push(advocate);
        toppedUp = true;
      }
    }
  }

  const ranked = pool
    .map((advocate) => {
      const { points, reasons } = scoreAdvocate(advocate, {
        category, matter, cityNames, cityLabel, language, keywords: intent.keywords,
      });
      return { advocate, points, reasons };
    })
    .sort((a, b) => b.points - a.points)
    .slice(0, MAX_RESULTS);

  return {
    // True when lawyers outside the exact search were added to fill the list.
    // Different from `relaxed`, which means the exact search found nobody at
    // all — the two need different wording on screen.
    toppedUp,
    city,
    // What to call the place on screen: the directory's spelling when we have
    // a page for it, otherwise exactly what the visitor said.
    cityLabel,
    relaxed,
    totalMatched: pool.length,
    lawyers: ranked.map(({ advocate, points, reasons }) => ({
      // The same card payload the directory hands its own lists, so the result
      // renders in the existing lawyer card with no new shape to keep in sync.
      ...toCardAdvocate(advocate),
      match: {
        reason: reasonSentence(reasons),
        score: Math.round(points),
      },
    })),
  };
}
