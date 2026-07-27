/**
 * Ask the device for its position and turn it into a place we can display.
 *
 * Shared by the header's location chooser and by the automatic detection that
 * runs on arrival, so both resolve a location the same way. Coordinates alone
 * are never enough: nobody can confirm a pair of decimals is their own area, so
 * they are reverse-geocoded to a name before being shown.
 *
 * Browser-only — `navigator.geolocation` does not exist on the server.
 *
 * @param {{timeout?: number, highAccuracy?: boolean}} [opts]
 * @returns {Promise<{label:string, city:string, state:string, lat:number, lng:number}>}
 *   Rejects if geolocation is unavailable, refused, or times out.
 */
export function detectLocation({ timeout = 10000, highAccuracy = true } = {}) {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not available on this device.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const fallback = { label: 'Your location', city: '', state: '', lat, lng };
        try {
          const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`, { cache: 'no-store' });
          const place = await res.json().catch(() => ({}));
          // Even when the name lookup fails the coordinates are good, and they
          // are what the distance filter actually runs on.
          resolve(
            res.ok && place?.label
              ? {
                  label: place.label,
                  city: place.city || '',
                  state: place.state || '',
                  lat: place.lat ?? lat,
                  lng: place.lng ?? lng,
                }
              : fallback
          );
        } catch {
          resolve(fallback);
        }
      },
      reject,
      { enableHighAccuracy: highAccuracy, timeout }
    );
  });
}
