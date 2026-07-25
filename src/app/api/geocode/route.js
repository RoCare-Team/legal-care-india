import { NextResponse } from 'next/server';
import { geocodeQuery, reverseGeocode, searchPlaces } from '@/lib/geocode';

/**
 * GET /api/geocode — everything the site needs to turn places into coordinates
 * and back. All of it runs server-side so the OpenStreetMap User-Agent and
 * rate-limit policy is honoured in one place.
 *
 *   ?pincode=110001            → { lat, lng }        (listing distance filter)
 *   ?q=Connaught Place, Delhi  → { lat, lng }        (single best match)
 *   ?search=saket              → { results: [ … ] }  (location picker type-ahead)
 *   ?lat=28.5&lng=77.2         → { label, city, … }  (browser position → place name)
 */

const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const pincode = (searchParams.get('pincode') || '').trim();
  const q = (searchParams.get('q') || '').trim();
  const search = (searchParams.get('search') || '').trim();
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  // ── Coordinates → place name ──────────────────────────────────────────────
  if (lat !== null && lng !== null) {
    const place = await reverseGeocode(lat, lng);
    if (!place) {
      return NextResponse.json(
        { error: 'Could not work out that location.' },
        { status: 404, headers: NO_STORE }
      );
    }
    return NextResponse.json(place, { headers: NO_STORE });
  }

  // ── Type-ahead suggestions ────────────────────────────────────────────────
  if (search) {
    const results = await searchPlaces(search);
    return NextResponse.json({ results }, { headers: NO_STORE });
  }

  // ── Single best match (pincode / free text) ───────────────────────────────
  if (pincode && !/^\d{6}$/.test(pincode)) {
    return NextResponse.json({ error: 'Enter a valid 6-digit pincode.' }, { status: 400 });
  }

  const query = pincode ? `${pincode}, India` : q;
  if (!query) {
    return NextResponse.json({ error: 'Provide a pincode or place.' }, { status: 400 });
  }

  const loc = await geocodeQuery(query);
  if (!loc) {
    return NextResponse.json({ error: 'Could not find that location.' }, { status: 404 });
  }

  return NextResponse.json(loc, { headers: NO_STORE });
}
