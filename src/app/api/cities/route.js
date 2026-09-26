import { NextResponse } from 'next/server';
import { SITE } from '@/constants/site';
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
 *
 * `pagesApi` is where an SEO or AI-visibility crawler goes next: every
 * indexable page for that city, grouped by practice area, with the keywords
 * each page is written for (see /api/state-pages). It is a full URL rather
 * than a path so a tool can follow it without knowing the site's host.
 */
export const revalidate = 300;

export async function GET() {
  try {
    const [cities, counts] = await Promise.all([getAllCities(), getLawyerCountsByCity()]);
    return NextResponse.json({
      success: true,
      // How many cities are listed. The per-city `count` below is a different
      // number — lawyers registered there — and both keep the names they have
      // had, because clients already read them.
      city_count: cities.length,
      cities: cities.map((c) => ({
        slug: c.slug,
        name: c.name,
        state: c.state,
        image: c.image || '',
        count: counts[c.name] || 0,
        pagesApi: new URL(`/api/state-pages?city=${encodeURIComponent(c.name)}`, SITE.url).toString(),
      })),
    });
  } catch (err) {
    console.error('GET /api/cities', err);
    return NextResponse.json({ success: false, city_count: 0, cities: [] });
  }
}
