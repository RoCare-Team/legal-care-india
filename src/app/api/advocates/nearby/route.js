import { NextResponse } from 'next/server';
import { getAllAdvocates } from '@/lib/advocates';
import { servesCity } from '@/utils/advocateCity';
import { distanceKm } from '@/utils/distance';

/**
 * GET /api/advocates/nearby?city=&state=&lat=&lng=&limit=
 *
 * The lawyers to show someone whose location we know — the home page's
 * "Advocate listing" band asks for this the moment the browser's location
 * prompt is allowed.
 *
 * The home page itself is static and served from the CDN, so it cannot be
 * rendered per visitor. It ships the newest lawyers, and this route is how the
 * band swaps them for the visitor's own city once there is a location to go on.
 * Shipping the whole directory to every visitor instead would put the entire
 * lawyer list in the HTML of the most-visited page on the site, on the chance
 * that some of them allow location.
 *
 * Answering is deliberately a chain rather than a single filter, because a
 * place name from a phone's GPS is not guaranteed to be a name any lawyer
 * typed. Each rung is a weaker claim than the one above it, and `scope` in the
 * response says which one answered so the caller can title the band honestly:
 *
 *   city   — lawyers based in, or working in, that city
 *   state  — nobody in the city; lawyers elsewhere in the same state
 *   nearby — no name matched at all; lawyers whose office is within NEAR_KM
 *   all    — nothing within reach; the newest lawyers, same as a cold visit
 *
 * Nothing here is personal: coordinates come in, lawyers go out, and no part
 * of the request is stored.
 */

/** How far out "nearby" reaches when no place name matched. */
const NEAR_KM = 100;

/** Cards the band can hold, and the ceiling on what a caller may ask for. */
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 48;

/** Same-state match, compared the way `servesCity` compares a city name. */
function inState(advocate, state) {
  return String(advocate?.state || '').trim().toLowerCase() === state;
}

/** The lawyer's geocoded office coordinates, or null if never geocoded. */
function officeCoords(advocate) {
  const loc = advocate?.office?.location;
  return typeof loc?.lat === 'number' && typeof loc?.lng === 'number' ? loc : null;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const city = String(searchParams.get('city') || '').trim();
  const state = String(searchParams.get('state') || '').trim().toLowerCase();
  const lat = Number(searchParams.get('lat'));
  const lng = Number(searchParams.get('lng'));
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number(searchParams.get('limit')) || DEFAULT_LIMIT)
  );

  const all = await getAllAdvocates();

  let scope = 'all';
  let place = '';
  let matched = [];

  if (city) {
    matched = all.filter((a) => servesCity(a, city));
    if (matched.length) {
      scope = 'city';
      place = city;
    }
  }

  if (!matched.length && state) {
    matched = all.filter((a) => inState(a, state));
    if (matched.length) {
      scope = 'state';
      // Echo what was asked for rather than the lower-cased comparison key.
      place = String(searchParams.get('state') || '').trim();
    }
  }

  if (!matched.length && hasCoords) {
    matched = all.filter((a) => {
      const loc = officeCoords(a);
      if (!loc) return false;
      const d = distanceKm(lat, lng, loc.lat, loc.lng);
      return d != null && d <= NEAR_KM;
    });
    if (matched.length) scope = 'nearby';
  }

  // Nothing anywhere near — hand back what a visitor with no location sees, so
  // the band still has lawyers in it. `scope: 'all'` tells the caller to say so.
  if (!matched.length) matched = all;

  // Within whichever set answered, nearest first: a lawyer two streets away is
  // a better first card than one at the other end of the same state. Anyone
  // whose office was never geocoded keeps the server's newest-first order, at
  // the end — an ungeocoded office is unknown, not far.
  //
  // Not the `all` fallback, though. Nothing there is near this visitor by
  // definition, so ordering it by distance would rank the whole of India by a
  // few hundred kilometres of nothing — and it is handed back as what a
  // visitor with no location sees, which is newest first.
  if (hasCoords && scope !== 'all') {
    matched = matched
      .map((a) => {
        const loc = officeCoords(a);
        return { advocate: a, distance: loc ? distanceKm(lat, lng, loc.lat, loc.lng) : null };
      })
      .sort((a, b) => {
        if (a.distance == null) return b.distance == null ? 0 : 1;
        if (b.distance == null) return -1;
        return a.distance - b.distance;
      })
      .map((row) => row.advocate);
  }

  return NextResponse.json(
    { scope, place, total: matched.length, advocates: matched.slice(0, limit) },
    // The answer depends only on the query, and the lawyer list behind it is
    // already tag-cached, so a shared cache may hold it briefly.
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } }
  );
}
