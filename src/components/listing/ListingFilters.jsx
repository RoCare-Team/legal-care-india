'use client';

import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input, Select, Button } from '@/components/ui';
import { LEGAL_SERVICE_NAMES } from '@/data/categories';
import { CITIES } from '@/data/cities';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'experience', label: 'Most Experienced' },
  { value: 'fee-low', label: 'Fee: Low to High' },
  { value: 'fee-high', label: 'Fee: High to Low' },
];

/**
 * ListingFilters — controlled filter bar for the advocate directory.
 *
 * @param {object} props
 * @param {{query:string,service:string,city:string,sort:string}} props.value
 * @param {(patch:object)=>void} props.onChange
 * @param {()=>void} props.onReset
 * @param {boolean} props.hasActiveFilters
 */
export default function ListingFilters({ value, onChange, onReset, hasActiveFilters }) {
  return (
    <div className="rounded-2xl border border-ink/8 bg-surface p-3 shadow-card sm:p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
        <div className="md:col-span-4">
          <Input
            value={value.query}
            onChange={(e) => onChange({ query: e.target.value })}
            placeholder="Search by name or keyword"
            leftIcon={<Search className="h-4 w-4" />}
            aria-label="Search advocates"
          />
        </div>
        <div className="md:col-span-3">
          <Select
            value={value.service}
            onChange={(e) => onChange({ service: e.target.value })}
            placeholder="All Legal Services"
            aria-label="Filter by legal service"
          >
            <option value="">All Legal Services</option>
            {LEGAL_SERVICE_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        </div>
        <div className="md:col-span-3">
          <Select
            value={value.city}
            onChange={(e) => onChange({ city: e.target.value })}
            aria-label="Filter by city"
          >
            <option value="">All Cities</option>
            {CITIES.map((c) => (
              <option key={c.slug} value={c.name}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="md:col-span-2">
          <Select
            value={value.sort}
            onChange={(e) => onChange({ sort: e.target.value })}
            options={SORT_OPTIONS}
            aria-label="Sort advocates"
          />
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mt-3 flex items-center justify-between border-t border-ink/8 pt-3">
          <span className="flex items-center gap-1.5 text-xs font-medium text-ink/50">
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            Filters applied
          </span>
          <Button variant="ghost" size="sm" onClick={onReset} leftIcon={<X className="h-4 w-4" />}>
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
