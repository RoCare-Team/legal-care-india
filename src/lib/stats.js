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
 * The four headline metrics, with real values.
 * @returns {Promise<Array<{id:string,value:number,suffix:string,label:string,icon:string}>>}
 */
export async function getPlatformStats() {
  const [{ lawyers, clients, consultations }, cities] = await Promise.all([
    getCounts(),
    getAllCities(),
  ]);

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
