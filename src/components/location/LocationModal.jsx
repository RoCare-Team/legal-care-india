'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, LocateFixed, MapPin, X, Loader2, ArrowLeft } from 'lucide-react';
import { useLocation } from './LocationProvider';

/** Quick picks for anyone who won't share their position or type a search. */
const POPULAR = ['Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Gurgaon'];

/**
 * LocationModal — pick a location by searching, by sharing your position, or
 * by tapping a city.
 *
 * The device is never asked for anything until "Use current location" is
 * tapped, and what comes back is turned into a place name before it is shown,
 * because nobody can confirm a pair of decimals is their own neighbourhood.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 */
export default function LocationModal({ open, onClose }) {
  const { location, setLocation, clearLocation } = useLocation();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');

  const inputRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Reset and focus each time it opens.
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setResults([]);
    setError('');
    setSearching(false);
    setLocating(false);
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  // Escape closes; the page behind must not scroll under the dialog.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);

    const { body } = document;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;
    body.style.overflow = 'hidden';
    if (gap > 0) body.style.paddingRight = `${gap}px`;

    return () => {
      document.removeEventListener('keydown', onKey);
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
    };
  }, [open, onClose]);

  // Type-ahead. Debounced so a fast typist doesn't fire a request per keystroke
  // — OpenStreetMap's free service is rate-limited and shared by everyone.
  useEffect(() => {
    const q = query.trim();
    if (!open || q.length < 3) {
      setResults([]);
      setSearching(false);
      return undefined;
    }

    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?search=${encodeURIComponent(q)}`, {
          cache: 'no-store',
        });
        const data = await res.json().catch(() => ({}));
        setResults(Array.isArray(data.results) ? data.results : []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(t);
  }, [query, open]);

  const choose = (place) => {
    setLocation({
      label: place.label,
      city: place.city || '',
      state: place.state || '',
      lat: place.lat,
      lng: place.lng,
    });
    onClose();
  };

  /** Ask the browser where we are, then turn that into a place name. */
  const useCurrent = () => {
    setError('');
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('This device can’t share its location. Search for your area instead.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`, { cache: 'no-store' });
          const place = await res.json().catch(() => ({}));
          // Even if the name lookup fails the coordinates are good, and they are
          // what the distance filter actually runs on.
          choose(
            res.ok && place?.label
              ? place
              : { label: 'Your location', city: '', state: '', lat, lng }
          );
        } catch {
          choose({ label: 'Your location', city: '', state: '', lat, lng });
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setError('Location access was blocked. Allow it in your browser, or search below.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  /** A popular city, resolved to coordinates on the server. */
  const chooseCity = async (city) => {
    setError('');
    setSearching(true);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(`${city}, India`)}`, {
        cache: 'no-store',
      });
      const loc = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError('Could not find that city. Please try the search.');
        return;
      }
      choose({ label: city, city, state: '', lat: loc.lat, lng: loc.lng });
    } catch {
      setError('Network problem. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center p-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-title"
    >
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-surface shadow-card-hover">
        <div className="flex items-center gap-2 border-b border-ink/8 px-4 py-3">
          <h2 id="location-title" className="flex-1 font-display text-base font-semibold text-ink">
            Choose your location
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-lg text-ink/45 hover:bg-ink/5 hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          {/* Search */}
          <div className="flex items-center gap-2 rounded-xl border border-ink/15 px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="text-ink/40 hover:text-ink"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            ) : (
              <Search className="h-4 w-4 shrink-0 text-ink/35" aria-hidden="true" />
            )}
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your area, locality or pincode"
              className="h-11 w-full bg-transparent text-sm text-ink placeholder:text-ink/40 focus:outline-none"
            />
            {searching && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />}
          </div>

          {/* Use current location */}
          <button
            type="button"
            onClick={useCurrent}
            disabled={locating}
            className="mt-3 flex w-full items-center gap-2.5 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-primary/[0.05] disabled:opacity-60"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              {locating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LocateFixed className="h-4 w-4" />
              )}
            </span>
            <span>
              <span className="block text-sm font-semibold text-primary">
                {locating ? 'Finding you…' : 'Use current location'}
              </span>
              <span className="block text-xs text-ink/45">Using your device’s GPS</span>
            </span>
          </button>

          {error && <p className="mt-2 px-2 text-xs text-red-600">{error}</p>}

          {/* Results, or the quick picks when nothing has been typed */}
          {query.trim().length >= 3 ? (
            <ul className="mt-3 max-h-64 overflow-y-auto border-t border-ink/8 pt-2">
              {results.map((place, i) => (
                <li key={`${place.lat}-${place.lng}-${i}`}>
                  <button
                    type="button"
                    onClick={() => choose(place)}
                    className="flex w-full items-start gap-2.5 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-ink/[0.04]"
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink/35" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-ink">{place.label}</span>
                      {place.detail && (
                        <span className="block truncate text-xs text-ink/45">{place.detail}</span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
              {!searching && results.length === 0 && (
                <li className="px-2 py-6 text-center text-sm text-ink/45">
                  Nothing found for “{query.trim()}”.
                </li>
              )}
            </ul>
          ) : (
            <div className="mt-3 border-t border-ink/8 pt-3">
              <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-ink/40">
                Popular cities
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {POPULAR.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => chooseCity(city)}
                    disabled={searching}
                    className="rounded-full border border-ink/12 px-3 py-1.5 text-sm text-ink/70 transition-colors hover:border-primary/40 hover:bg-primary/[0.05] hover:text-primary disabled:opacity-60"
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          )}

          {location && (
            <button
              type="button"
              onClick={() => {
                clearLocation();
                onClose();
              }}
              className="mt-4 w-full rounded-xl border border-ink/12 py-2 text-xs font-medium text-ink/55 transition-colors hover:border-red-300 hover:text-red-600"
            >
              Clear “{location.label}”
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
