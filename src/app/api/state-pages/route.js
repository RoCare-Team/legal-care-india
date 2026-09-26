import { NextResponse } from 'next/server';
import { SITE } from '@/constants/site';
import { CATEGORIES, getSubServiceLinks } from '@/data/categories';
import {
  servicePath, matterPath, cityServicePath, cityMatterPath,
} from '@/lib/serviceRoutes';
import { getAllCities } from '@/lib/cities';
import { NOINDEX } from '@/lib/noindex';
import { cityServiceMeta } from '@/components/views/CityServiceView';
import { cityMatterMeta } from '@/components/views/CityMatterView';
import { serviceMeta } from '@/components/views/ServiceView';
import { matterMeta } from '@/components/views/MatterView';

/**
 * GET /api/state-pages — every indexable page of the directory, grouped by
 * practice area, with the keywords each one is actually written for.
 *
 *   /api/state-pages?city=mumbai        the pages for one city
 *   /api/state-pages?state=maharashtra  every city in one state
 *   /api/state-pages?category=criminal-lawyer   one practice area only
 *   /api/state-pages                    the national pages (no city)
 *
 * Built for SEO and AI-visibility tools, which want the URL list and the
 * intent behind each URL in one read rather than crawling the whole site.
 *
 * The keywords are not written here. They come from the same `*Meta` functions
 * the pages themselves render their <meta> tags from, so this endpoint can
 * never drift from what a crawler finds on the page — if it did, the tool
 * reading it would be optimising against a description of a page that does not
 * exist.
 *
 * A "category" is a practice area (Criminal Law → `criminal-lawyer`), and it
 * carries every URL under it: the area's own page for that city, plus each
 * specific matter (bail, cheque bounce, divorce …). So `count` is usually far
 * more than one; a category with a single page is simply one that has no
 * matters listed under it, and the shape is the same either way.
 */

// The list only changes when a city or a service is added, so it is cached for
// an hour rather than rebuilt for every crawler that asks.
export const revalidate = 3600;

const PUBLIC_CACHE = {
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
};

/** "criminal lawyer in Mumbai, ..." — the page's own keyword list, as one string. */
function keywordLine(meta) {
  return (meta?.keywords || []).join(', ');
}

function absolute(path) {
  return new URL(path, SITE.url).toString();
}

/** Every URL one category has, for one city — or nationally when city is null. */
function urlsFor(category, city) {
  const matters = getSubServiceLinks(category.name);

  if (!city) {
    return [
      { url: absolute(servicePath(category)), meta_keywords: keywordLine(serviceMeta(category)) },
      ...matters.map((m) => ({
        url: absolute(matterPath(m.slug)),
        meta_keywords: keywordLine(matterMeta(category, m.name, m.slug)),
      })),
    ];
  }

  return [
    {
      url: absolute(cityServicePath(category, city)),
      meta_keywords: keywordLine(cityServiceMeta(category, city)),
    },
    ...matters.map((m) => ({
      url: absolute(cityMatterPath(m.slug, city)),
      meta_keywords: keywordLine(cityMatterMeta(category, m.name, m.slug, city)),
    })),
  ];
}

/** A city by slug or by name, so ?city=mumbai and ?city=Mumbai both work. */
function findCity(cities, raw) {
  const want = raw.trim().toLowerCase();
  return cities.find((c) => c.slug.toLowerCase() === want)
    || cities.find((c) => (c.name || '').toLowerCase() === want)
    || null;
}

export async function GET(request) {
  // The same switch the sitemap and robots.txt obey: while the site is hidden
  // from search engines, handing out its full URL list would undo that.
  if (NOINDEX) {
    return NextResponse.json(
      { success: true, noindex: true, scope: 'none', category_count: 0, url_count: 0, categories: [] },
      { headers: PUBLIC_CACHE }
    );
  }

  const params = new URL(request.url).searchParams;
  const askedCity = (params.get('city') || '').trim();
  const askedState = (params.get('state') || '').trim();
  const askedCategory = (params.get('category') || '').trim().toLowerCase();

  try {
    const all = await getAllCities();

    // Which cities this request covers. None means the national pages, which
    // are the same pages without a city in the URL.
    let cities = [];
    let scope = 'all';

    if (askedCity) {
      const city = findCity(all, askedCity);
      if (!city) {
        return NextResponse.json(
          { success: false, error: `No pages for "${askedCity}".`, scope: `city:${askedCity}`, categories: [] },
          { status: 404, headers: PUBLIC_CACHE }
        );
      }
      cities = [city];
      scope = `city:${city.name}`;
    } else if (askedState) {
      const want = askedState.toLowerCase();
      cities = all.filter((c) => (c.state || '').toLowerCase() === want);
      if (!cities.length) {
        return NextResponse.json(
          { success: false, error: `No cities in "${askedState}".`, scope: `state:${askedState}`, categories: [] },
          { status: 404, headers: PUBLIC_CACHE }
        );
      }
      scope = `state:${cities[0].state}`;
    }

    const wanted = askedCategory
      ? CATEGORIES.filter((c) => c.slug.toLowerCase() === askedCategory
        || c.name.toLowerCase() === askedCategory)
      : CATEGORIES;

    if (!wanted.length) {
      return NextResponse.json(
        { success: false, error: `No such category "${askedCategory}".`, scope, categories: [] },
        { status: 404, headers: PUBLIC_CACHE }
      );
    }

    // Grouped by practice area, with every city's URLs under the same group —
    // a tool asking for a whole state wants "all the criminal pages", not the
    // same category repeated once per city.
    const categories = wanted.map((category) => {
      const urls = cities.length
        ? cities.flatMap((city) => urlsFor(category, city))
        : urlsFor(category, null);
      return { category: category.slug, name: category.name, count: urls.length, urls };
    });

    return NextResponse.json(
      {
        success: true,
        scope,
        ...(cities.length > 1 ? { city_count: cities.length } : {}),
        category_count: categories.length,
        url_count: categories.reduce((sum, c) => sum + c.count, 0),
        categories,
      },
      { headers: PUBLIC_CACHE }
    );
  } catch (err) {
    console.error('GET /api/state-pages', err);
    return NextResponse.json(
      { success: false, error: 'Could not build the page list.' },
      { status: 500 }
    );
  }
}
