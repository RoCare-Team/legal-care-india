import {
  getServiceBySlug,
  getServiceByAnySlug,
  findMatterBySlug,
} from '@/data/categories';
import { getCityBySlug } from '@/lib/cities';

/**
 * The public URL scheme for cities, legal services and specific matters.
 *
 * Everything lives at the root so the URLs stay short and keyword-rich:
 *
 *   /mumbai                          a city
 *   /criminal-lawyer                 a legal service
 *   /bail-matters-lawyer             a specific matter
 *   /criminal-lawyer-in-mumbai       a service, scoped to a city
 *   /bail-matters-lawyer-in-mumbai   a matter, scoped to a city
 *
 * Every page is one segment: nothing is nested, so a matter does not carry its
 * category in the path. That works because matter slugs are unique across the
 * whole list (see SUB_SLUG_OVERRIDES in data/categories).
 *
 * Next.js allows only ONE dynamic segment per level, so all of the above are
 * the same route — `resolveSegment` below is what decides which page a given
 * slug actually is. Services and matters both end in `-lawyer`, so services are
 * matched exactly first and a city can never be mistaken for either.
 */

/** The `-in-<city>` joiner and the `-lawyer` suffix, in one place. */
const IN = '-in-';
const LAWYER_SUFFIX = '-lawyer';

export function cityPath(city) {
  return `/${city.slug}`;
}

export function servicePath(service) {
  return `/${service.slug}`;
}

export function matterPath(subSlug) {
  return `/${subSlug}${LAWYER_SUFFIX}`;
}

export function cityServicePath(service, city) {
  return `/${service.slug}${IN}${city.slug}`;
}

export function cityMatterPath(subSlug, city) {
  return `/${subSlug}${LAWYER_SUFFIX}${IN}${city.slug}`;
}

/**
 * Work out what a single root-level slug refers to.
 *
 * @param {string} raw the URL segment
 * @returns {Promise<null | {
 *   kind: 'service' | 'city' | 'matter' | 'city-service' | 'city-matter',
 *   city?: object, service?: object, subService?: string, subSlug?: string
 * }>} null when the slug matches nothing (the caller should 404).
 */
export async function resolveSegment(raw) {
  const slug = String(raw || '').toLowerCase();
  if (!slug) return null;

  // Plain service, then plain city — both are exact matches. Services are
  // checked first because they also end in `-lawyer`, like matters do.
  const service = getServiceBySlug(slug);
  if (service) return { kind: 'service', service };

  const city = await getCityBySlug(slug);
  if (city) return { kind: 'city', city };

  // "<matter>-lawyer" — a specific matter, across the whole country.
  if (slug.endsWith(LAWYER_SUFFIX)) {
    const subSlug = slug.slice(0, -LAWYER_SUFFIX.length);
    const match = findMatterBySlug(subSlug);
    if (match) {
      return {
        kind: 'matter',
        service: match.service,
        subService: match.subService,
        subSlug,
      };
    }
  }

  // Anything else must be a city-scoped page: "<subject>-in-<city>". A city
  // slug could itself contain "-in-", so try each joiner from the right until
  // the right-hand side is a city we actually know.
  for (let at = slug.lastIndexOf(IN); at > 0; at = slug.lastIndexOf(IN, at - 1)) {
    const subject = slug.slice(0, at);
    const inCity = await getCityBySlug(slug.slice(at + IN.length));
    if (!inCity) continue;

    const inService = getServiceBySlug(subject);
    if (inService) return { kind: 'city-service', city: inCity, service: inService };

    // "<matter>-lawyer-in-<city>" — strip the suffix and look the matter up
    // across every category (matter slugs are globally unique).
    if (subject.endsWith(LAWYER_SUFFIX)) {
      const subSlug = subject.slice(0, -LAWYER_SUFFIX.length);
      const match = findMatterBySlug(subSlug);
      if (match) {
        return {
          kind: 'city-matter',
          city: inCity,
          service: match.service,
          subService: match.subService,
          subSlug,
        };
      }
    }
  }

  return null;
}

/**
 * Resolve a slug that may be using the retired `-law` naming, for redirects.
 * Returns the canonical path, or null if it wasn't a legacy slug.
 */
export async function legacySegmentPath(raw) {
  const slug = String(raw || '').toLowerCase();
  const service = getServiceByAnySlug(slug);
  if (service) return servicePath(service);

  for (let at = slug.lastIndexOf(IN); at > 0; at = slug.lastIndexOf(IN, at - 1)) {
    const inCity = await getCityBySlug(slug.slice(at + IN.length));
    if (!inCity) continue;
    const inService = getServiceByAnySlug(slug.slice(0, at));
    if (inService) return cityServicePath(inService, inCity);
  }

  return null;
}
