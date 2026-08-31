import { NextResponse } from 'next/server';
import { getAllAdvocates } from '@/lib/advocates';
import { filterAdvocates, sortAdvocates, ADVOCATE_SORTS } from '@/lib/advocateSearch';
import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';

/**
 * GET /api/advocates — the lawyer directory.
 *
 * The website has no equivalent call: /lawyers ships the whole list inside the
 * page and filters it in the browser. That works when the client is the page
 * itself and cannot work for a phone, so this is the same directory answered
 * over HTTP — the same `getAllAdvocates()` read behind the same tag cache, and
 * the same filter and sort rules from lib/advocateSearch that the web listing
 * runs. A query typed here and the same query typed on /lawyers return the
 * same lawyers in the same order.
 *
 * Query: q, city, service, subService, court, availability, sort, page, perPage
 *
 * `availability` is read live rather than from the cached records, because
 * `available` inside an hour-old cache entry is a lawyer's answer from an hour
 * ago. /api/presence answers it from the database on every call and this uses
 * exactly that rule, so the two can never disagree.
 */
export const dynamic = 'force-dynamic';

const DEFAULT_PER_PAGE = 20;
const MAX_PER_PAGE = 50;

/** The ids of lawyers whose own availability switch is on, read fresh. */
async function onlineIds() {
  await connectDB();
  const rows = await Advocate.find({ available: true, status: 'published' })
    .select('_id')
    .lean();
  return new Set(rows.map((r) => String(r._id)));
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const filters = {
    query: searchParams.get('q') || '',
    city: searchParams.get('city') || '',
    service: searchParams.get('service') || '',
    subService: searchParams.get('subService') || '',
    court: searchParams.get('court') || '',
  };
  const availability = (searchParams.get('availability') || '').trim();
  const requested = (searchParams.get('sort') || '').trim();
  // An unknown sort is not an error worth failing a search over; it falls back
  // to the same default the filter bar opens on.
  const sort = ADVOCATE_SORTS.includes(requested) ? requested : 'relevance';

  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const perPage = Math.min(
    MAX_PER_PAGE,
    Math.max(1, Number(searchParams.get('perPage')) || DEFAULT_PER_PAGE)
  );

  try {
    let rows = filterAdvocates(await getAllAdvocates(), filters);

    if (availability === 'online' || availability === 'offline') {
      const online = await onlineIds();
      const want = availability === 'online';
      rows = rows.filter((a) => online.has(String(a._id)) === want);
    }

    rows = sortAdvocates(rows, sort);

    const total = rows.length;
    const start = (page - 1) * perPage;

    return NextResponse.json(
      {
        advocates: rows.slice(start, start + perPage),
        total,
        page,
        perPage,
        totalPages: Math.max(1, Math.ceil(total / perPage)),
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    console.error('GET /api/advocates', err);
    return NextResponse.json(
      { error: 'Could not load lawyers. Please try again.' },
      { status: 500 }
    );
  }
}
