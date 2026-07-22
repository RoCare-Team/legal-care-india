'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin } from 'lucide-react';
import { Button } from '@/components/ui';
import FullScreenLoader from '@/components/shared/FullScreenLoader';
import { slugify } from '@/utils/slugify';

/**
 * SearchBar — the primary directory search: legal service/keyword + city.
 * Navigates to the lawyers listing with query params.
 *
 * @param {object} props
 * @param {string} [props.className]
 */
/**
 * How long the loader is held before the navigation is actually fired.
 *
 * In production the listing is pre-rendered and Next prefetches it, so the push
 * completes in a few milliseconds — the overlay would mount and unmount inside
 * one frame and the visitor would see nothing but an abrupt page swap. Holding
 * it briefly makes the search feel answered. In development, where the route
 * compiles on demand, the real wait is longer than this and the hold costs
 * nothing.
 */
const LOADER_HOLD_MS = 650;

export default function SearchBar({ className }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  // The listing page is server-rendered, so the click and the new page can be a
  // beat apart. Navigating inside a transition keeps `pending` true for exactly
  // that gap.
  const [pending, startTransition] = useTransition();
  // Shown from the moment of the click, not from the moment the route starts
  // resolving. Stays up until this component unmounts with the old page.
  const [searching, setSearching] = useState(false);
  const holdTimer = useRef(null);

  // A pending navigation must not outlive the component (fast double-back, or
  // React unmounting the old tree) with a stray timer still queued.
  useEffect(() => () => clearTimeout(holdTimer.current), []);

  const onSubmit = (e) => {
    e.preventDefault();
    if (searching) return;
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (city.trim()) params.set('city', slugify(city));
    const href = `/lawyers${params.toString() ? `?${params}` : ''}`;

    setSearching(true);
    holdTimer.current = setTimeout(() => {
      startTransition(() => router.push(href));
    }, LOADER_HOLD_MS);
  };

  return (
    <>
      {/* The wait belongs on the screen, not tucked inside the button — the
          visitor's eyes are on the page, and a centred overlay also blocks a
          second submit while the listing loads. */}
      {(searching || pending) && <FullScreenLoader message="Finding lawyers for you" />}

      <form
        onSubmit={onSubmit}
        className={`flex flex-col gap-2.5 rounded-2xl border border-ink/8 bg-surface p-2.5 shadow-card transition-colors focus-within:border-primary/40 sm:flex-row sm:gap-2 sm:p-2 ${className || ''}`}
      >
        <label className="flex flex-1 items-center gap-2 rounded-lg border border-ink/10 bg-muted/30 px-3 py-2 transition-colors focus-within:border-primary/50 focus-within:[&_svg]:text-primary sm:border-transparent sm:bg-transparent sm:py-2.5 sm:focus-within:bg-ink/[0.035]">
          <Search className="h-5 w-5 shrink-0 text-ink/40" aria-hidden="true" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Legal service, e.g. Family Law"
            aria-label="Search legal service or keyword"
            className="w-full bg-transparent text-sm text-ink placeholder:text-ink/40 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </label>

        <span className="hidden w-px bg-ink/8 sm:block" aria-hidden="true" />

        <label className="flex flex-1 items-center gap-2 rounded-lg border border-ink/10 bg-muted/30 px-3 py-2 transition-colors focus-within:border-primary/50 focus-within:[&_svg]:text-primary sm:border-transparent sm:bg-transparent sm:py-2.5 sm:focus-within:bg-ink/[0.035]">
          <MapPin className="h-5 w-5 shrink-0 text-ink/40" aria-hidden="true" />
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City, e.g. Mumbai"
            aria-label="Search by city"
            className="w-full bg-transparent text-sm text-ink placeholder:text-ink/40 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </label>

        <Button
          type="submit"
          size="lg"
          disabled={searching}
          aria-busy={searching}
          leftIcon={<Search className="h-4 w-4" aria-hidden="true" />}
          className="h-11 py-2 sm:h-13 sm:w-40 sm:py-3.5"
        >
          Search
        </Button>
      </form>
    </>
  );
}
