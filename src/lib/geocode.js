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
const USER_AGENT = 'LegalCareIndia/1.0 (support@legalcareindia.com)';

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
