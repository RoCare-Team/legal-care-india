'use client';

import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input, Select, Button } from '@/components/ui';
import { LEGAL_SERVICE_NAMES } from '@/data/categories';
import { CITIES } from '@/data/cities';
import { COURTS } from '@/data/courts';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'experience', label: 'Most Experienced' },
  { value: 'fee-low', label: 'Fee: Low to High' },
  { value: 'fee-high', label: 'Fee: High to Low' },
];

/** A filter control with an optional label (shown only in the elevated bar). */
function Field({ label, elevated, className, children }) {
  return (
    <div className={className}>
      {elevated && (
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink/45">
          {label}
        </label>
      )}
      {children}
    </div>
  );
}

/**
 * ListingFilters — controlled filter bar for the advocate directory.
 *
 * @param {object} props
 * @param {{query:string,service:string,city:string,sort:string}} props.value
 * @param {(patch:object)=>void} props.onChange
 * @param {()=>void} props.onReset
 * @param {boolean} props.hasActiveFilters
 */
export default function ListingFilters({ value, onChange, onReset, hasActiveFilters, elevated = false }) {
  return (
    <div
      className={`rounded-2xl border border-ink/8 bg-surface p-4 sm:p-5 ${
        elevated ? 'shadow-card-hover ring-1 ring-ink/5' : 'shadow-card'
      }`}
    >
      {elevated && (
        <div className="mb-4 flex items-center gap-2.5 border-b border-ink/8 pb-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Search className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="font-display text-sm font-semibold text-ink">Find your advocate</p>
            <p className="text-xs text-ink/50">Search by name, or narrow down by legal service and city.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
        <Field label="Search" elevated={elevated} className="md:col-span-3">
          <Input
            value={value.query}
            onChange={(e) => onChange({ query: e.target.value })}
            placeholder="Search by name or keyword"
            leftIcon={<Search className="h-4 w-4" />}
            aria-label="Search advocates"
          />
        </Field>
        <Field label="Legal service" elevated={elevated} className="md:col-span-3">
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
        </Field>
        <Field label="Court" elevated={elevated} className="md:col-span-2">
          <Select
            value={value.court}
            onChange={(e) => onChange({ court: e.target.value })}
            aria-label="Filter by court"
          >
            <option value="">All Courts</option>
            {COURTS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="City" elevated={elevated} className="md:col-span-2">
          <Select
            value={value.city}
            onChange={(e) => onChange({ city: e.target.value })}
            aria-label="Filter by city"
          >
            <option value="">All Cities</option>
            {/* A searched city that isn't in our master list (e.g. typed by hand)
                still needs an option so the dropdown shows it selected. */}
            {value.city && !CITIES.some((c) => c.name === value.city) && (
              <option value={value.city}>{value.city}</option>
            )}
            {CITIES.map((c) => (
              <option key={c.slug} value={c.name}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Sort by" elevated={elevated} className="md:col-span-2">
          <Select
            value={value.sort}
            onChange={(e) => onChange({ sort: e.target.value })}
            options={SORT_OPTIONS}
            aria-label="Sort advocates"
          />
        </Field>
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
