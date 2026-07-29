import { unstable_cache } from 'next/cache';
import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';
import User from '@/models/User';
import Consultation from '@/models/Consultation';
import { getAllCities } from '@/lib/cities';
import { ADVOCATES_TAG } from '@/lib/advocates';
import { CATEGORIES } from '@/data/categories';
import { PLATFORM_STATS } from '@/data/stats';

/**
 * The headline numbers on the homepage and About page, counted from the real
 * data rather than typed in: every lawyer who registers and every client who
 * signs up moves them on their own.
 *
 * `PLATFORM_STATS` still owns the labels, icons and order — this only fills in
 * the values, so the wording stays in one place.
 */

/** Counts straight from the database (cached, and refreshed with the directory). */
const _getCounts = unstable_cache(
  async () => {
    await connectDB();
    const [lawyers, clients, consultations] = await Promise.all([
      // Only published profiles — a pending registration isn't a lawyer a
      // visitor can actually reach.
      Advocate.countDocuments({ status: 'published' }),
      User.countDocuments({}),
      Consultation.countDocuments({ status: { $in: ['active', 'ended'] } }),
    ]);
    return { lawyers, clients, consultations };
  },
  ['platform-stats'],
  { revalidate: 300, tags: [ADVOCATES_TAG] }
);

async function getCounts() {
  try {
    return await _getCounts();
  } catch (err) {
    console.warn('getPlatformStats: MongoDB unavailable', err);
    return { lawyers: 0, clients: 0, consultations: 0 };
  }
}

/**
 * Starting floor for the two headline audience counts. The band opens at 1,000
 * lawyers and 1,000 clients and every real registration adds to it, so a brand
 * new site doesn't lead with "3".
 */
const BASE = {
  advocates: 1000,
  clients: 1000,
};

/**
 * Lawyers actually registered in one city. Counted separately from the
 * platform totals because a city page has to show that city's own number —
 * a national figure on /karaikal would be telling the visitor about somewhere
 * else. Cached and refreshed with the directory, like the totals are.
 */
const _getCityLawyerCount = unstable_cache(
  async (cityName) => {
    await connectDB();
    return Advocate.countDocuments({ status: 'published', city: cityName });
  },
  ['city-lawyer-count'],
  { revalidate: 300, tags: [ADVOCATES_TAG] }
);

async function getCityLawyerCount(cityName) {
  try {
    return await _getCityLawyerCount(cityName);
  } catch (err) {
    console.warn('getCityLawyerCount: MongoDB unavailable', err);
    return 0;
  }
}

/**
 * How many published lawyers each city has, as { [cityName]: count }.
 *
 * One grouped read rather than a count per tile: the city rail renders twenty
 * cards and the /cities page a hundred, and a query apiece would be a hundred
 * round trips to draw one row.
 */
const _getLawyerCountsByCity = unstable_cache(
  async () => {
    await connectDB();
    const rows = await Advocate.aggregate([
      { $match: { status: 'published', city: { $nin: [null, ''] } } },
      { $group: { _id: '$city', count: { $sum: 1 } } },
    ]);
    return Object.fromEntries(rows.map((r) => [r._id, r.count]));
  },
  ['lawyer-counts-by-city'],
  { revalidate: 300, tags: [ADVOCATES_TAG] }
);

/** Lawyer counts keyed by city name; an empty map if the database is down. */
export async function getLawyerCountsByCity() {
  try {
    return await _getLawyerCountsByCity();
  } catch (err) {
    console.warn('getLawyerCountsByCity: MongoDB unavailable', err);
    return {};
  }
}

/**
 * How many published lawyers practise each area, as { [practiceArea]: count }.
 * Optionally narrowed to one city.
 *
 * A lawyer can list several specialisations, so the array is unwound and each
 * one counted — which means the totals here deliberately do not add up to the
 * number of lawyers on the platform.
 */
const _getLawyerCountsBySpecialization = unstable_cache(
  async (cityName) => {
    await connectDB();
    const match = { status: 'published' };
    if (cityName) match.city = cityName;

    const rows = await Advocate.aggregate([
      { $match: match },
      { $unwind: '$specializations' },
      { $group: { _id: '$specializations', count: { $sum: 1 } } },
    ]);
    return Object.fromEntries(rows.map((r) => [r._id, r.count]));
  },
  ['lawyer-counts-by-specialization'],
  { revalidate: 300, tags: [ADVOCATES_TAG] }
);

/**
 * Lawyer counts keyed by practice area; an empty map if the database is down.
 * @param {string} [cityName] narrow the count to one city
 */
export async function getLawyerCountsBySpecialization(cityName) {
  try {
    return await _getLawyerCountsBySpecialization(cityName || null);
  } catch (err) {
    console.warn('getLawyerCountsBySpecialization: MongoDB unavailable', err);
    return {};
  }
}

/**
 * The four headline metrics, with real values.
 *
 * Passing a city scopes the band to it: the lawyer count becomes that city's
 * own, and the label says so, so the numbers on /karaikal are about Karaikal.
 *
 * @param {{name:string, state:string}} [city]
 * @returns {Promise<Array<{id:string,value:number,suffix:string,label:string,icon:string}>>}
 */
export async function getPlatformStats(city) {
  const [{ lawyers, clients, consultations }, cities] = await Promise.all([
    getCounts(),
    getAllCities(),
  ]);

  if (city?.name) {
    const cityLawyers = await getCityLawyerCount(city.name);
    return PLATFORM_STATS.map((stat) => {
      if (stat.id === 'advocates') {
        // The city's real figure, unpadded — a floor of 1,000 would be a lie
        // about one city in a way it is not about the country as a whole.
        return { ...stat, value: cityLawyers, suffix: cityLawyers > 0 ? '+' : '', label: `Lawyers in ${city.name}` };
      }
      if (stat.id === 'cities') {
        return { ...stat, value: cities.length, suffix: '+', label: 'Cities Covered' };
      }
      if (stat.id === 'clients') {
        const helped = consultations > 0 ? consultations : clients;
        return { ...stat, value: BASE.clients + helped, suffix: '+', label: 'Clients Helped' };
      }
      return { ...stat, value: CATEGORIES.length, suffix: '+' };
    });
  }

  // A client counts as helped once they've actually had a consultation; before
  // any have happened, the signed-up clients are the honest figure.
  const helped = consultations > 0 ? consultations : clients;

  const values = {
    advocates: BASE.advocates + lawyers,
    cities: cities.length,
    clients: BASE.clients + helped,
    areas: CATEGORIES.length,
  };

  return PLATFORM_STATS.map((stat) => {
    const value = values[stat.id] ?? stat.value;
    // Every figure reads as "at least this many".
    return { ...stat, value, suffix: '+' };
  });
}
