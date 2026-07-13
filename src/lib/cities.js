import { unstable_cache } from 'next/cache';
import { CITIES } from '@/data/cities';
import { connectDB } from '@/lib/db';
import City from '@/models/City';

/**
 * City data-access. Cities come from two places, merged into one list:
 *   1. Built-in cities in src/data/cities.js (the curated popular cities).
 *   2. Cities added by an admin, stored in MongoDB.
 *
 * The merged list is cached and tagged, so a newly added city appears on the
 * public site immediately (the admin API calls revalidateTag).
 */
export const CITIES_TAG = 'cities';

const _getDbCities = unstable_cache(
  async () => {
    await connectDB();
    const rows = await City.find({}).sort({ createdAt: -1 }).lean();
    return rows.map((r) => ({
      slug: r.slug,
      name: r.name,
      state: r.state,
      advocates: r.advocates || 0,
      image: r.image || '',
      custom: true, // admin-added (so the panel can offer delete)
    }));
  },
  ['db-cities'],
  { revalidate: 3600, tags: [CITIES_TAG] }
);

/** DB cities only (empty if the DB is unreachable). */
async function getDbCities() {
  try {
    return await _getDbCities();
  } catch (err) {
    console.warn('getDbCities: MongoDB unavailable', err);
    return [];
  }
}

/**
 * All cities — built-in first, then admin-added ones (deduped by slug).
 * Used by the homepage, /cities, city pages and the sitemap.
 */
export async function getAllCities() {
  const dbCities = await getDbCities();
  const staticSlugs = new Set(CITIES.map((c) => c.slug));
  const extras = dbCities.filter((c) => !staticSlugs.has(c.slug));
  return [...CITIES, ...extras];
}

/** A single city by slug, or null. */
export async function getCityBySlug(slug) {
  const all = await getAllCities();
  return all.find((c) => c.slug === slug) || null;
}
