/**
 * Geocoding via OpenStreetMap's free Nominatim service — turns a human address
 * (or a pincode) into { lat, lng } coordinates. Server-side only.
 *
 * Used to locate a lawyer's office when they register or edit their profile,
 * and to resolve a user-typed pincode, so the directory can offer a
 * "lawyers within X km of me" distance filter.
 *
 * Nominatim usage policy: a valid identifying User-Agent is required and the
 * service is rate-limited (≈1 request/second). We only geocode on the
 * occasional write (register / profile save / pincode lookup), so this is well
 * within the limits.
 */
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';
const USER_AGENT = 'LegalCareIndia/1.0 (support@legalcareindia.com)';

/** Shared fetch: identifies us per Nominatim policy and never caches. */
async function nominatim(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'en' },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json();
}

/**
 * The town/city and state out of a Nominatim address block, whatever level of
 * detail it happened to return (a metro comes back as `city`, a small town as
 * `town` or `village`, a Delhi neighbourhood only as `state_district`).
 */
function placeParts(address = {}) {
  const city =
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.county ||
    address.state_district ||
    '';
  const area =
    address.suburb || address.neighbourhood || address.city_district || address.hamlet || '';
  return { area, city, state: address.state || '', postcode: address.postcode || '' };
}

/** "Sector 49, Gurgaon" — short enough for a navbar button. */
function shortLabel({ area, city, state }) {
  return [area, city || state].filter(Boolean).join(', ') || state || 'Your location';
}

/**
 * Reverse geocode: coordinates → a place a person recognises.
 *
 * This is what turns the browser's "28.42, 77.04" into "Sector 49, Gurgaon" for
 * the location picker — nobody can confirm a pair of decimals is their area.
 *
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<{label:string,area:string,city:string,state:string,postcode:string,lat:number,lng:number}|null>}
 */
export async function reverseGeocode(lat, lng) {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  try {
    const url = `${NOMINATIM_REVERSE_URL}?format=jsonv2&zoom=14&lat=${latitude}&lon=${longitude}`;
    const data = await nominatim(url);
    if (!data || data.error) return null;

    const parts = placeParts(data.address || {});
    return { ...parts, label: shortLabel(parts), lat: latitude, lng: longitude };
  } catch (err) {
    console.warn('reverseGeocode failed:', err?.message || err);
    return null;
  }
}

/**
 * Search places for the location picker's type-ahead. Returns several matches
 * (unlike `geocodeQuery`, which answers with the single best one), each with a
 * short label for the row and the full one for context.
 *
 * @param {string} query
 * @param {number} [limit=6]
 * @returns {Promise<Array<{label:string,detail:string,city:string,state:string,lat:number,lng:number}>>}
 */
export async function searchPlaces(query, limit = 6) {
  const q = String(query || '').trim();
  if (q.length < 3) return [];

  try {
    const url =
      `${NOMINATIM_URL}?format=jsonv2&addressdetails=1&countrycodes=in` +
      `&limit=${Math.min(10, Math.max(1, limit))}&q=${encodeURIComponent(q)}`;
    const data = await nominatim(url);
    if (!Array.isArray(data)) return [];

    return data
      .map((row) => {
        const lat = parseFloat(row.lat);
        const lng = parseFloat(row.lon);
        if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

        const parts = placeParts(row.address || {});
        // Nominatim's own first segment is usually the most specific name
        // ("Saket", "Badshahpur Sohna Road"), which beats anything we'd rebuild.
        const head = String(row.display_name || '').split(',')[0].trim();
        const label = head || shortLabel(parts);
        return {
          label,
          detail: [parts.area, parts.city, parts.state].filter(Boolean).join(', '),
          city: parts.city,
          state: parts.state,
          lat,
          lng,
        };
      })
      .filter(Boolean);
  } catch (err) {
    console.warn('searchPlaces failed:', err?.message || err);
    return [];
  }
}

/**
 * Geocode a free-text query string. Restricted to India for accuracy.
 * @param {string} query
 * @returns {Promise<{lat:number,lng:number}|null>}
 */
export async function geocodeQuery(query) {
  const q = String(query || '').trim();
  if (!q) return null;

  try {
    const url = `${NOMINATIM_URL}?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'en' },
      // These lookups happen server-side on writes; don't let Next cache them.
      cache: 'no-store',
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

    return { lat, lng };
  } catch (err) {
    console.warn('geocodeQuery failed:', err?.message || err);
    return null;
  }
}

/**
 * Geocode a structured office address with progressive fallbacks.
 *
 * A very specific office line ("Office No. 903, 9th Floor, ...") often returns
 * nothing from OpenStreetMap, so instead of giving up we degrade gracefully:
 * full address → area+city → pincode+city → city+state. This way a lawyer is
 * at least locatable at their city centre (good enough for a distance filter)
 * rather than dropping out of it entirely with null coordinates.
 *
 * @param {{address?:string,area?:string,city?:string,state?:string,pincode?:string}} parts
 * @returns {Promise<{lat:number,lng:number}|null>}
 */
export async function geocodeAddress(parts = {}) {
  // Collapse newlines/extra spaces — multi-line textarea addresses otherwise
  // build a broken query string.
  const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();
  const address = clean(parts.address);
  const area = clean(parts.area);
  const city = clean(parts.city);
  const state = clean(parts.state);
  const pincode = clean(parts.pincode);

  // Most specific → least specific. Empty parts drop out.
  const candidates = [
    [address, area, city, state, pincode],
    [area, city, state, pincode],
    [pincode, city, state],
    [area, city, state],
    [city, state],
  ];

  const tried = new Set();
  for (const group of candidates) {
    const query = group.filter(Boolean).join(', ');
    if (!query || tried.has(query)) continue; // skip empties + duplicate attempts
    tried.add(query);
    // eslint-disable-next-line no-await-in-loop
    const loc = await geocodeQuery(`${query}, India`);
    if (loc) {
      console.log(`[geocode] ✓ "${query}" →`, loc);
      return loc;
    }
  }
  console.warn('[geocode] ✗ no coordinates for any of:', [...tried]);
  return null;
}
