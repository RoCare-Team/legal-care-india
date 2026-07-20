'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { slugify } from '@/utils/slugify';

/**
 * SearchBar — the primary directory search: legal service/keyword + city.
 * Navigates to the advocates listing with query params.
 *
 * @param {object} props
 * @param {string} [props.className]
 */
export default function SearchBar({ className }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  // The listing page is server-rendered, so the click and the new page can be a
  // beat apart. Navigating inside a transition keeps `pending` true for exactly
  // that gap, which is what drives the button's spinner.
  const [pending, startTransition] = useTransition();

  const onSubmit = (e) => {
    e.preventDefault();
    if (pending) return;
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (city.trim()) params.set('city', slugify(city));
    startTransition(() => {
      router.push(`/advocates${params.toString() ? `?${params}` : ''}`);
    });
  };

  return (
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
        disabled={pending}
        aria-busy={pending}
        leftIcon={
          pending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Search className="h-4 w-4" aria-hidden="true" />
          )
        }
        // Fixed width so swapping "Search" for "Searching…" doesn't resize the
        // button and shift the fields beside it.
        className="h-11 py-2 sm:h-13 sm:w-40 sm:py-3.5"
      >
        {pending ? 'Searching…' : 'Search'}
      </Button>
    </form>
  );
}
