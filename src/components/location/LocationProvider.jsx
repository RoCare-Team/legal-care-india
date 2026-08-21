'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { detectLocation } from '@/utils/geolocate';
import { slugify } from '@/utils/slugify';

/**
 * LocationProvider — the visitor's chosen location, shared app-wide.
 *
 * Kept in localStorage rather than on the account: a signed-out visitor picks a
 * location too, and it should still be there when they come back. It is only a
 * place name and a pair of coordinates, and it never leaves the browser except
 * as the reverse-geocode lookup that turns coordinates into a name.
 *
 * On arrival with nothing stored, the browser is asked for the device position
 * directly — see the detection effect below for what that costs.
 *
 * Shape: { label, city, state, lat, lng }
 *
 * The city list comes down from the root layout so that a chosen place can be
 * matched to the city page it belongs to — see `cityPathFor`.
 */
const STORAGE_KEY = 'lci_location';
/**
 * Marks that this browsing session already tried to detect a location.
 * Session-scoped on purpose: once someone has refused, every later page load
 * would otherwise call geolocation again — silently rejected by the browser,
 * but a wasted round trip on each navigation.
 */
const PROMPTED_KEY = 'lci_location_prompted';

const LocationContext = createContext(null);

/**
 * The city page a place belongs to, or null when the site has no page for it.
 *
 * Matching is on the slugified city name, which is how the slugs were built in
 * the first place, so "New Delhi" and "new-delhi" reach the same row. The name
 * is compared as well as the slug because an admin-added city is free to carry
 * a slug that is not simply its name.
 *
 * Returning null is a real answer, not a failure: the geocoder knows every town
 * in India and the site has pages for a couple of dozen. Somewhere with no page
 * is the common case, and the caller is expected to stay put rather than send
 * anyone to a 404.
 *
 * The state is tried after the city because the geocoder leaves `city` empty
 * for a union territory — searching Delhi returns state "Delhi" and no city at
 * all, and Delhi is exactly the sort of place someone picks. Trying it second
 * costs nothing: a state only matches when a city page happens to carry its
 * name, which is only true of the city-states.
 *
 * @param {Array<{slug: string, name: string}>} cities
 * @param {{city?: string, state?: string}} place
 * @returns {string|null}
 */
function cityPathFor(cities, place) {
  for (const candidate of [place?.city, place?.state]) {
    const wanted = slugify(candidate || '');
    if (!wanted) continue;
    const match = cities.find((c) => c.slug === wanted || slugify(c.name) === wanted);
    if (match) return `/${match.slug}`;
  }
  return null;
}

export default function LocationProvider({ children, cities = [] }) {
  // `undefined` until the stored value is read, so nothing renders "Set
  // location" for a frame before the saved one appears.
  const [location, setLocation] = useState(undefined);
  // The chooser lives here rather than in the header button, so that it exists
  // once for the whole app and can also be opened without anyone clicking.
  const [pickerOpen, setPickerOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const saved = raw ? JSON.parse(raw) : null;
      setLocation(
        saved && Number.isFinite(saved.lat) && Number.isFinite(saved.lng) ? saved : null
      );
    } catch {
      setLocation(null);
    }
  }, []);

  const save = useCallback((next) => {
    setLocation(next);
    try {
      if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* private mode / storage full — the app still works for this session */
    }
  }, []);

  // Ask the browser for a position on arrival, when none is stored yet. This is
  // what raises Chrome's own "Allow this time / Allow on every visit" prompt;
  // allowing it fills the header straight away, with no dialog of ours first.
  //
  // Note this spends the single prompt a browser ever shows for an origin: if
  // the visitor dismisses or blocks it, nothing can ask again and they have to
  // use the header control instead. Refusal is therefore silent by design —
  // there is no error worth showing for a choice they made deliberately.
  useEffect(() => {
    if (location !== null) return undefined; // not read yet, or already chosen
    // The admin panel is not the public site — nobody there is looking for a
    // lawyer nearby, and it must not spend the prompt either.
    if (pathname?.startsWith('/admin')) return undefined;
    try {
      if (window.sessionStorage.getItem(PROMPTED_KEY)) return undefined;
      window.sessionStorage.setItem(PROMPTED_KEY, '1');
    } catch {
      return undefined; // private mode — skip rather than re-prompt every load
    }

    let cancelled = false;
    detectLocation()
      .then((place) => {
        if (!cancelled) save(place);
      })
      .catch(() => {
        /* refused, unavailable or timed out — the header control still works */
      });
    return () => {
      cancelled = true;
    };
  }, [location, pathname, save]);

  const value = useMemo(
    () => ({
      location: location || null,
      // Distinguishes "nothing chosen" from "not read yet".
      ready: location !== undefined,
      setLocation: save,
      clearLocation: () => save(null),
      pickerOpen,
      openPicker: () => setPickerOpen(true),
      closePicker: () => setPickerOpen(false),
      // Exposed rather than acted on here: the provider stores a location,
      // it does not navigate. Whoever asked the visitor to choose decides
      // whether choosing should also move them.
      cityPathFor: (place) => cityPathFor(cities, place),
    }),
    [location, save, pickerOpen, cities]
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

/** The chosen location plus the setters. Safe to call outside the provider. */
export function useLocation() {
  return (
    useContext(LocationContext) || {
      location: null,
      ready: false,
      setLocation: () => {},
      clearLocation: () => {},
      pickerOpen: false,
      openPicker: () => {},
      closePicker: () => {},
      cityPathFor: () => null,
    }
  );
}
