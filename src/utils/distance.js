/**
 * Great-circle distance between two lat/lng points, in kilometres (Haversine).
 * Returns null if any coordinate is missing/invalid so callers can skip records
 * that haven't been geocoded yet.
 *
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number|null}
 */
export function distanceKm(lat1, lng1, lat2, lng2) {
  const vals = [lat1, lng1, lat2, lng2];
  if (vals.some((v) => typeof v !== 'number' || Number.isNaN(v))) return null;

  const R = 6371; // Earth's radius in km
  const toRad = (d) => (d * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Short human label for a distance, e.g. "800 m away" / "3.2 km away". */
export function formatDistance(km) {
  if (typeof km !== 'number' || Number.isNaN(km)) return '';
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km away`;
}
