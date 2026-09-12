'use client';

import { useMemo, useState } from 'react';
import { Search, X, SearchX } from 'lucide-react';
import ServiceCard from './ServiceCard';

/**
 * ServicesCatalogue — the searchable grid on /services.
 *
 * The whole catalogue is a few dozen rows, so it arrives with the page and is
 * narrowed in the browser: a category chip or a typed word filters instantly,
 * with no round trip and nothing to wait for. (The mobile app asks
 * /api/marketplace/services for the same list, because a phone cannot be
 * handed the page itself.)
 *
 * @param {object} props
 * @param {Array} props.services    every active service
 * @param {Array} props.categories  [{ name, count }]
 */
export default function ServicesCatalogue({ services = [], categories = [] }) {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return services.filter((s) => {
      if (category && s.category !== category) return false;
      if (!term) return true;
      // Title and summary only — the same rule the API uses, so a search here
      // and the same search in the app return the same services.
      return `${s.title} ${s.summary}`.toLowerCase().includes(term);
    });
  }, [services, q, category]);

  const chip = (active) =>
    `rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors ${
      active
        ? 'border-primary bg-primary text-white shadow-sm'
        : 'border-ink/12 bg-surface text-ink/70 hover:border-primary/40 hover:text-primary'
    }`;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-sm sm:flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40"
            aria-hidden="true"
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search services"
            placeholder="Search services…"
            className="h-11 w-full rounded-xl border border-ink/12 bg-surface pl-10 pr-9 text-sm text-ink outline-none transition-colors placeholder:text-ink/40 focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-ink/40 hover:bg-ink/5 hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <p className="text-sm text-ink/55 sm:ml-auto">
          <span className="font-semibold text-ink">{filtered.length}</span>{' '}
          {filtered.length === 1 ? 'service' : 'services'}
        </p>
      </div>

      {/* Categories as chips rather than a dropdown: there are eight of them,
          and a shelf you can see is a shelf you can choose from. */}
      {categories.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => setCategory('')} className={chip(!category)}>
            All
            <span className={category ? 'ml-1.5 text-ink/40' : 'ml-1.5 text-white/60'}>
              {services.length}
            </span>
          </button>
          {categories.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => setCategory(category === c.name ? '' : c.name)}
              className={chip(category === c.name)}
            >
              {c.name}
              <span className={category === c.name ? 'ml-1.5 text-white/60' : 'ml-1.5 text-ink/40'}>
                {c.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {filtered.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      ) : (
        <div className="mt-6 grid place-items-center rounded-2xl border border-dashed border-ink/15 bg-muted/40 px-6 py-16 text-center">
          <SearchX className="h-10 w-10 text-ink/30" aria-hidden="true" />
          <h3 className="mt-4 font-semibold text-ink">No service matches that</h3>
          <p className="mt-1 max-w-sm text-sm text-ink/55">
            Try another word, or clear the filters to see everything on offer.
          </p>
          <button
            type="button"
            onClick={() => {
              setQ('');
              setCategory('');
            }}
            className="mt-4 rounded-xl border border-ink/12 bg-surface px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-primary/30 hover:text-primary"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
