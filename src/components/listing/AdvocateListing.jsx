'use client';

import { useMemo, useState } from 'react';
import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui';
import AdvocateCard from '@/components/cards/AdvocateCard';
import ListingFilters from './ListingFilters';
import { pluralize } from '@/utils/formatters';

/**
 * AdvocateListing — client-side filterable directory grid.
 * Receives the full advocate list + initial filters from the server page.
 *
 * @param {object} props
 * @param {Array} props.advocates
 * @param {{query?:string,service?:string,city?:string}} [props.initial]
 * @param {boolean} [props.showFilters=true]   hide the filter bar on focused pages
 * @param {string} [props.emptyTitle]          heading for the empty state
 * @param {string} [props.emptyMessage]        supporting text for the empty state
 * @param {import('react').ReactNode} [props.emptyAction]  custom empty-state CTA
 */
const EMPTY = { query: '', service: '', city: '', sort: 'relevance' };

function sortAdvocates(list, sort) {
  const copy = [...list];
  switch (sort) {
    case 'rating':
      return copy.sort((a, b) => b.rating - a.rating);
    case 'experience':
      return copy.sort((a, b) => b.experience - a.experience);
    case 'fee-low':
      return copy.sort((a, b) => a.consultationFee - b.consultationFee);
    case 'fee-high':
      return copy.sort((a, b) => b.consultationFee - a.consultationFee);
    default:
      return copy.sort((a, b) => b.rating * b.reviews - a.rating * a.reviews);
  }
}

export default function AdvocateListing({
  advocates,
  initial = {},
  showFilters = true,
  floatFilters = false,
  emptyTitle,
  emptyMessage,
  emptyAction,
}) {
  const [filters, setFilters] = useState({ ...EMPTY, ...initial });

  const onChange = (patch) => setFilters((prev) => ({ ...prev, ...patch }));
  const onReset = () => setFilters(EMPTY);

  const hasActiveFilters =
    Boolean(filters.query || filters.service || filters.city) || filters.sort !== 'relevance';

  const results = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    const filtered = advocates.filter((a) => {
      const matchesQuery =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.tagline?.toLowerCase().includes(q) ||
        a.specializations?.some((s) => s.toLowerCase().includes(q));
      const matchesService =
        !filters.service || a.specializations?.includes(filters.service);
      const matchesCity = !filters.city || a.city === filters.city;
      return matchesQuery && matchesService && matchesCity;
    });
    return sortAdvocates(filtered, filters.sort);
  }, [advocates, filters]);

  return (
    <div className="space-y-6">
      {showFilters && (
        <>
          <ListingFilters
            value={filters}
            onChange={onChange}
            onReset={onReset}
            hasActiveFilters={hasActiveFilters}
            elevated={floatFilters}
          />

          <div className="flex items-center justify-between">
            <p className="text-sm text-ink/60">
              <span className="font-semibold text-ink">{results.length}</span>{' '}
              {pluralize(results.length, 'advocate').replace(`${results.length} `, '')} found
            </p>
          </div>
        </>
      )}

      {results.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((advocate) => (
            <AdvocateCard key={advocate.id || advocate._id || advocate.slug} advocate={advocate} />
          ))}
        </div>
      ) : (
        <div className="grid place-items-center rounded-2xl border border-dashed border-ink/15 bg-muted/40 px-6 py-16 text-center">
          <SearchX className="h-10 w-10 text-ink/30" aria-hidden="true" />
          <h3 className="mt-4 font-semibold text-ink">
            {emptyTitle || (hasActiveFilters ? 'No advocates match your filters' : 'No advocates listed yet')}
          </h3>
          <p className="mt-1 max-w-sm text-sm text-ink/55">
            {emptyMessage ||
              (hasActiveFilters
                ? 'Try broadening your search — remove a filter or search a different city or legal service.'
                : 'No advocate has been added here yet. Check back soon or explore other legal services.')}
          </p>
          {emptyAction ? (
            <div className="mt-5">{emptyAction}</div>
          ) : (
            hasActiveFilters && (
              <Button variant="outline" size="sm" className="mt-5" onClick={onReset}>
                Clear all filters
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
}
