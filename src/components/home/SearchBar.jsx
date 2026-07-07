'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin } from 'lucide-react';
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

  const onSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (city.trim()) params.set('city', slugify(city));
    router.push(`/advocates${params.toString() ? `?${params}` : ''}`);
  };

  return (
    <form
      onSubmit={onSubmit}
      className={`flex flex-col gap-2 rounded-2xl border border-ink/8 bg-surface p-2 shadow-card sm:flex-row ${className || ''}`}
    >
      <label className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5">
        <Search className="h-5 w-5 shrink-0 text-ink/40" aria-hidden="true" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Legal service, e.g. Family Law"
          aria-label="Search legal service or keyword"
          className="w-full bg-transparent text-sm text-ink placeholder:text-ink/40 focus:outline-none"
        />
      </label>

      <span className="hidden w-px bg-ink/8 sm:block" aria-hidden="true" />

      <label className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5">
        <MapPin className="h-5 w-5 shrink-0 text-ink/40" aria-hidden="true" />
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City, e.g. Mumbai"
          aria-label="Search by city"
          className="w-full bg-transparent text-sm text-ink placeholder:text-ink/40 focus:outline-none"
        />
      </label>

      <Button type="submit" size="lg" leftIcon={<Search className="h-4 w-4" />}>
        Search
      </Button>
    </form>
  );
}
