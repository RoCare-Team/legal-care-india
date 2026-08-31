import { NextResponse } from 'next/server';
import { getAllCities } from '@/lib/cities';
import { getLawyerCountsByCity } from '@/lib/stats';

/**
 * GET /api/cities — every city the directory has a page for.
 *
 * Built-in cities first, then the ones an admin added, which is the order
 * `getAllCities` returns and the order the website's own city rail and /cities
 * grid render — so the app's list is not merely the same set but the same
 * sequence, and "the first twenty" means the same twenty in both.
 *
 * `count` is how many lawyers have actually registered there, the same figure
 * the website prints on each tile. The `advocates` number carried on the older
 * built-in records is a legacy seed figure and is not a count of anything;
 * `count` is what a client should show.
 */
export const revalidate = 300;

export async function GET() {
  try {
    const [cities, counts] = await Promise.all([getAllCities(), getLawyerCountsByCity()]);
    return NextResponse.json({
      cities: cities.map((c) => ({
        slug: c.slug,
        name: c.name,
        state: c.state,
        image: c.image || '',
        count: counts[c.name] || 0,
      })),
    });
  } catch (err) {
    console.error('GET /api/cities', err);
    return NextResponse.json({ cities: [] });
  }
}
