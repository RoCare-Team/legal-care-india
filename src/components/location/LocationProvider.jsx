'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * LocationProvider — the visitor's chosen location, shared app-wide.
 *
 * Kept in localStorage rather than on the account: a signed-out visitor picks a
 * location too, and it should still be there when they come back. It is only a
 * place name and a pair of coordinates the person chose themselves — nothing is
 * read from the device without them tapping "Use current location".
 *
 * Shape: { label, city, state, lat, lng }
 */
const STORAGE_KEY = 'lci_location';

const LocationContext = createContext(null);

export default function LocationProvider({ children }) {
  // `undefined` until the stored value is read, so nothing renders "Set
  // location" for a frame before the saved one appears.
  const [location, setLocation] = useState(undefined);

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

  const value = useMemo(
    () => ({
      location: location || null,
      // Distinguishes "nothing chosen" from "not read yet".
      ready: location !== undefined,
      setLocation: save,
      clearLocation: () => save(null),
    }),
    [location, save]
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
    }
  );
}
