import { NextResponse } from 'next/server';
import { lookupPincode, lookupCityPincode } from '@/lib/pincode';
import { STATES, allCitiesForState } from '@/data/indiaLocations';

/**
 * GET /api/pincode?code=122001 — the state and city a PIN code belongs to.
 *
 * Used by the registration wizard to fill in a location from one field
 * instead of two dropdowns. Open to signed-out visitors by design: it is
 * public postal data, and registration happens before there is an account.
 */

export const dynamic = 'force-dynamic';

/**
 * Cities India Post still files under their pre-renaming names, and the
 * districts that are really one city split administratively.
 *
 * Without these a Bengaluru advocate would be filed under "Bangalore" and a
 * Connaught Place one under "Central Delhi" — two directory entries for one
 * place, which splits the search results every visitor is trying to read.
 * Keyed by the normalised form, so case and punctuation don't matter.
 */
const CITY_ALIASES = {
  bangalore: 'Bengaluru',
  bombay: 'Mumbai',
  calcutta: 'Kolkata',
  madras: 'Chennai',
  poona: 'Pune',
  mysore: 'Mysuru',
  baroda: 'Vadodara',
  cochin: 'Kochi',
  trivandrum: 'Thiruvananthapuram',
  allahabad: 'Prayagraj',
  gauhati: 'Guwahati',
  pondicherry: 'Puducherry',
  gurugram: 'Gurgaon',
  // Delhi is one city to anyone looking for a lawyer in it; India Post files
  // its PINs under the administrative district.
  centraldelhi: 'New Delhi',
  newdelhi: 'New Delhi',
  northwestdelhi: 'North Delhi',
  southwestdelhi: 'South Delhi',
  southeastdelhi: 'South Delhi',
  northeastdelhi: 'East Delhi',
  shahdara: 'East Delhi',
};

/**
 * A name reduced to the letters that identify it.
 *
 * '&' becomes 'and' before anything is stripped — India Post writes
 * 'Jammu & Kashmir' where the form writes 'Jammu and Kashmir', and dropping
 * the ampersand outright would leave 'jammukashmir' against
 * 'jammuandkashmir': two spellings of one state that never match.
 */
const normalise = (v) =>
  String(v || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z]/g, '');

/** States India Post spells differently from the form's own list. */
const STATE_ALIASES = {
  chattisgarh: 'Chhattisgarh',
  orissa: 'Odisha',
  uttaranchal: 'Uttarakhand',
  pondicherry: 'Puducherry',
  delhi: 'Delhi',
  nctofdelhi: 'Delhi',
  andamanandnicobarislands: 'Andaman and Nicobar Islands',
  dadraandnagarhavelianddamananddiu: 'Dadra and Nagar Haveli and Daman and Diu',
  damananddiu: 'Dadra and Nagar Haveli and Daman and Diu',
  dadraandnagarhaveli: 'Dadra and Nagar Haveli and Daman and Diu',
};

/**
 * Match India Post's district against the city list the form actually offers.
 *
 * Exact first, then ignoring case and punctuation, then the alias table above.
 * A district none of those can place is returned as-is with `inList: false`,
 * and the form offers it as an extra option rather than silently selecting
 * nothing and looking as though the lookup failed.
 */
function matchCity(rawDistrict, state) {
  const options = allCitiesForState(state);
  // India Post disambiguates same-named districts with a bracketed suffix —
  // "Bilaspur(Cgh)" — which is a filing note, not part of the city's name.
  const district = String(rawDistrict || '').replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  if (!district) return { city: '', inList: false };

  const exact = options.find((c) => c === district);
  if (exact) return { city: exact, inList: true };

  const target = normalise(district);
  const loose = options.find((c) => normalise(c) === target);
  if (loose) return { city: loose, inList: true };

  const alias = CITY_ALIASES[target];
  if (alias && options.includes(alias)) return { city: alias, inList: true };

  return { city: district, inList: false };
}

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const code = (params.get('code') || '').trim();
  const city = (params.get('city') || '').trim();

  // ── The other direction: city (+ state) → a PIN for it ──────────────────
  // Answered only when no PIN was given, so one endpoint serves both without
  // the two ever contradicting each other.
  if (!code && city) {
    // India Post is a renaming behind: it knows Bangalore, not Bengaluru. The
    // alias table maps their name to ours, so it is inverted here to ask them
    // under the name they actually file the city by.
    const wanted = normalise(city);
    const legacy = Object.entries(CITY_ALIASES)
      .filter(([, modern]) => normalise(modern) === wanted)
      .map(([old]) => old);

    const pincode = await lookupCityPincode([city, ...legacy], params.get('state') || '');
    return NextResponse.json(
      { pincode },
      { headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=604800' } }
    );
  }

  if (!/^[1-9][0-9]{5}$/.test(code)) {
    return NextResponse.json(
      { error: 'Enter a valid 6-digit PIN code.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const place = await lookupPincode(code);
  if (!place) {
    return NextResponse.json(
      { error: 'No location found for that PIN code.' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // Only a state the form knows can be selected in it. India Post's spelling
  // is matched loosely for the same reason the district is.
  const state =
    STATES.find((s) => s === place.state) ||
    STATES.find((s) => normalise(s) === normalise(place.state)) ||
    STATE_ALIASES[normalise(place.state)] ||
    '';

  const matched = matchCity(place.district, state);

  return NextResponse.json(
    {
      pincode: place.pincode,
      state,
      city: matched.city,
      // Whether the city is one of the form's own options; when it is not, the
      // form adds it so the visitor is not left with an empty select.
      cityInList: matched.inList,
      area: place.area,
    },
    // A PIN code's district does not change. A day in the browser and a week
    // at the edge saves the third party a request per keystroke-completed form.
    { headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=604800' } }
  );
}
