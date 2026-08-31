import { NextResponse } from 'next/server';
import { CATEGORIES, getSubServiceLinks } from '@/data/categories';
import { COURTS } from '@/data/courts';
import { LANGUAGES } from '@/data/languages';
import { getLawyerCountsBySpecialization } from '@/lib/stats';

/**
 * GET /api/services — the practice areas, their matters, and the reference
 * lists a client needs to build the same filters the website offers.
 *
 * Courts and languages come down with them rather than from three separate
 * calls: they are the other two dropdowns on the filter bar, they change about
 * once a year, and a phone opening the directory would otherwise wait on three
 * round trips to draw one row of controls.
 *
 * `icon` is dropped deliberately — a category carries a React component there,
 * which will not serialise and means nothing off the web.
 */
export const revalidate = 300;

export async function GET() {
  try {
    const counts = await getLawyerCountsBySpecialization();
    return NextResponse.json({
      services: CATEGORIES.map((c) => ({
        name: c.name,
        slug: c.slug,
        description: c.description || '',
        count: counts[c.name] || 0,
        // `getSubServiceLinks` is what builds the website's own matter links,
        // so a matter's slug here is the one that addresses its page there.
        subServices: getSubServiceLinks(c.name).map((s) => ({ name: s.name, slug: s.slug })),
      })),
      courts: COURTS,
      languages: LANGUAGES,
    });
  } catch (err) {
    console.error('GET /api/services', err);
    return NextResponse.json({ error: 'Could not load legal services.' }, { status: 500 });
  }
}
