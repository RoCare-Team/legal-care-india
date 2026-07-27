'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, LocateFixed, MapPin, X, Loader2, ChevronRight } from 'lucide-react';
import { useLocation } from './LocationProvider';
import { detectLocation } from '@/utils/geolocate';

/**
 * LocationModal — pick a location by sharing your position or by searching.
 *
 * Whatever comes back is turned into a place name before it is shown, because
 * nobody can confirm a pair of decimals is their own neighbourhood.
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
  const useCurrent = async () => {
    setError('');
    setLocating(true);
    try {
      choose(await detectLocation());
    } catch {
      setError('Location access was blocked. Allow it in your browser, or search below.');
    } finally {
      setLocating(false);
    }
  };

  if (!open || !mounted) return null;

  const typing = query.trim().length >= 3;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center p-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-title"
    >
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-surface shadow-card-hover ring-1 ring-ink/[0.07]">
        {/* Header — a navy wash so the dialog has a top, not just an edge. */}
        <div className="flex items-start gap-3 border-b border-ink/[0.07] bg-gradient-to-br from-primary/[0.06] to-transparent px-5 py-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <MapPin className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="location-title" className="font-display text-base font-bold text-ink">
              Choose your location
            </h2>
            <p className="mt-0.5 text-xs text-ink/50">
              So we can show you lawyers nearest to you first.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink/40 transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          {/* The primary action — a real button, not a hover row. */}
          <button
            type="button"
            onClick={useCurrent}
            disabled={locating}
            className="flex w-full items-center gap-3 rounded-2xl border border-primary/25 bg-primary/[0.04] px-4 py-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/[0.08] disabled:opacity-60"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-white">
              {locating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LocateFixed className="h-4 w-4" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-primary">
                {locating ? 'Finding you…' : 'Use my current location'}
              </span>
              <span className="block text-xs text-ink/50">Detected from your device</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-primary/40" aria-hidden="true" />
          </button>

          {error && (
            <p className="mt-2.5 rounded-xl bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-700">
              {error}
            </p>
          )}

          {/* Divider with the alternative spelled out. */}
          <div className="my-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-ink/[0.08]" aria-hidden="true" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ink/35">
              or search
            </span>
            <span className="h-px flex-1 bg-ink/[0.08]" aria-hidden="true" />
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-ink/15 px-3.5 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
            <Search className="h-4 w-4 shrink-0 text-ink/35" aria-hidden="true" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Area, locality or pincode"
              className="h-11 w-full bg-transparent text-sm text-ink placeholder:text-ink/40 focus:outline-none"
            />
            {searching ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" aria-hidden="true" />
            ) : (
              query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="shrink-0 text-ink/35 transition-colors hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              )
            )}
          </div>

          {/* Results once there is enough to search on. */}
          {typing ? (
            <ul className="mt-2 max-h-64 space-y-0.5 overflow-y-auto">
              {results.map((place, i) => (
                <li key={`${place.lat}-${place.lng}-${i}`}>
                  <button
                    type="button"
                    onClick={() => choose(place)}
                    className="group flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-primary/[0.05]"
                  >
                    <MapPin
                      className="mt-0.5 h-4 w-4 shrink-0 text-ink/30 transition-colors group-hover:text-primary"
                      aria-hidden="true"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-ink transition-colors group-hover:text-primary">
                        {place.label}
                      </span>
                      {place.detail && (
                        <span className="block truncate text-xs text-ink/45">{place.detail}</span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
              {!searching && results.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-ink/45">
                  Nothing found for “{query.trim()}”.
                </li>
              )}
            </ul>
          ) : (
            <p className="mt-2.5 px-1 text-xs leading-relaxed text-ink/40">
              Type at least 3 characters — for example a sector, a colony name or a 6-digit
              pincode.
            </p>
          )}

          {location && (
            <div className="mt-4 border-t border-ink/[0.07] pt-3">
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 text-xs text-ink/50">
                  Currently set to{' '}
                  <span className="font-semibold text-ink/70">{location.label}</span>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    clearLocation();
                    onClose();
                  }}
                  className="shrink-0 text-xs font-semibold text-ink/45 transition-colors hover:text-red-600"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
