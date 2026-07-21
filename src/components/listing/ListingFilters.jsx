'use client';

import { Search, SlidersHorizontal, X, MapPin, LocateFixed, Loader2 } from 'lucide-react';
import { Input, Select, Button } from '@/components/ui';
import { LEGAL_SERVICE_NAMES, getSubServices } from '@/data/categories';
import { CITIES } from '@/data/cities';
import { COURTS } from '@/data/courts';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'experience', label: 'Most Experienced' },
  { value: 'fee-low', label: 'Fee: Low to High' },
  { value: 'fee-high', label: 'Fee: High to Low' },
];

/** Distance radius chips (km) shown once the searcher's location is known. */
const RADIUS_OPTIONS = [3, 5, 10, 25, 50, 100];

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
 * ListingFilters — controlled filter bar for the lawyer directory.
 *
 * @param {object} props
 * @param {{query:string,service:string,subService:string,court:string,city:string,sort:string}} props.value
 * @param {(patch:object)=>void} props.onChange
 * @param {()=>void} props.onReset
 * @param {boolean} props.hasActiveFilters
 * @param {Array<{slug:string,name:string}>} [props.cities]  built-in + admin-added
 */
export default function ListingFilters({
  value,
  onChange,
  onReset,
  hasActiveFilters,
  elevated = false,
  cities = CITIES,
  // Distance / "near me" controls (wired up by AdvocateListing).
  userLocation = null,
  locationLabel = '',
  locating = false,
  locationError = '',
  onUseMyLocation,
  onClearLocation,
}) {
  // Sub-categories of the chosen service (e.g. Tax Law → GST, Appeals).
  const subServices = getSubServices(value.service);
  // Show the Category dropdown only once a legal service (with sub-categories)
  // has been picked — hidden by default so it doesn't clutter the bar.
  const showCategory = Boolean(value.service) && subServices.length > 0;

  const hasLocationControls = Boolean(onUseMyLocation);

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
            <p className="font-display text-sm font-semibold text-ink">Find your lawyer</p>
            <p className="text-xs text-ink/50">Search by name, or narrow down by legal service and city.</p>
          </div>
        </div>
      )}

      {/* Filters — 2 per row on tablets, 3 on laptops, all in a single row on xl.
          The Category dropdown only appears once a legal service is picked (and
          that service actually has sub-categories), so the xl track template
          switches between 6 and 5 columns accordingly.
          In the single row the tracks are weighted, not equal: free-text search
          needs the most room, City the least (names are short). minmax(0,…)
          stops a long option label from forcing a track wider than its share. */}
      <div
        className={`grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:gap-2.5 ${
          showCategory
            ? 'xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1.15fr)_minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,0.75fr)_minmax(0,1fr)]'
            : 'xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,0.75fr)_minmax(0,1fr)]'
        }`}
      >
        <Field label="Search" elevated={elevated}>
          <Input
            value={value.query}
            onChange={(e) => onChange({ query: e.target.value })}
            placeholder="Search by name or keyword"
            leftIcon={<Search className="h-4 w-4" />}
            aria-label="Search lawyers"
          />
        </Field>
        <Field label="Legal service" elevated={elevated}>
          <Select
            value={value.service}
            // Changing the service invalidates the chosen sub-category, so clear
            // it in the same patch — otherwise a stale pair filters to nothing.
            onChange={(e) => onChange({ service: e.target.value, subService: '' })}
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
        {showCategory && (
        <Field label="Category" elevated={elevated}>
          <Select
            value={value.subService || ''}
            onChange={(e) => onChange({ subService: e.target.value })}
            aria-label="Filter by category"
          >
            <option value="">All Categories</option>
            {subServices.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        </Field>
        )}
        <Field label="Court" elevated={elevated}>
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
        <Field label="City" elevated={elevated}>
          <Select
            value={value.city}
            onChange={(e) => onChange({ city: e.target.value })}
            aria-label="Filter by city"
          >
            <option value="">All Cities</option>
            {/* A searched city that isn't in our master list (e.g. typed by hand)
                still needs an option so the dropdown shows it selected. */}
            {value.city && !cities.some((c) => c.name === value.city) && (
              <option value={value.city}>{value.city}</option>
            )}
            {cities.map((c) => (
              <option key={c.slug} value={c.name}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Sort by" elevated={elevated}>
          <Select
            value={value.sort}
            onChange={(e) => onChange({ sort: e.target.value })}
            options={SORT_OPTIONS}
            aria-label="Sort lawyers"
          />
        </Field>
      </div>

      {/* ── Near me: distance filter ─────────────────────────────────────── */}
      {hasLocationControls && (
        <div className="mt-3 border-t border-ink/8 pt-3">
          {!userLocation ? (
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink/45">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> Lawyers near me
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onUseMyLocation}
                disabled={locating}
                leftIcon={
                  locating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LocateFixed className="h-4 w-4" />
                  )
                }
              >
                {locating ? 'Locating…' : 'Use my location'}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  {locationLabel || 'Your location'}
                </span>
                <button
                  type="button"
                  onClick={onClearLocation}
                  className="inline-flex items-center gap-1 text-xs font-medium text-ink/50 hover:text-ink"
                >
                  <X className="h-3.5 w-3.5" /> Clear
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink/45">Within</span>
                {RADIUS_OPTIONS.map((km) => {
                  const active = String(value.radius) === String(km);
                  return (
                    <button
                      key={km}
                      type="button"
                      onClick={() => onChange({ radius: active ? '' : km })}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        active
                          ? 'border-primary bg-primary text-white'
                          : 'border-ink/15 bg-surface text-ink/70 hover:border-primary/50 hover:text-primary'
                      }`}
                    >
                      {km} km
                    </button>
                  );
                })}
                {value.radius && (
                  <button
                    type="button"
                    onClick={() => onChange({ radius: '' })}
                    className="text-xs font-medium text-ink/50 hover:text-ink"
                  >
                    Any distance
                  </button>
                )}
              </div>
            </div>
          )}
          {locationError && (
            <p className="mt-2 text-xs font-medium text-red-600">{locationError}</p>
          )}
        </div>
      )}

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
