'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { detectLocation } from '@/utils/geolocate';

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

export default function LocationProvider({ children }) {
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
    }),
    [location, save, pickerOpen]
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
    }
  );
}
