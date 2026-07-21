'use client';

import { useMemo, useState } from 'react';
import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui';
import AdvocateCard from '@/components/cards/AdvocateCard';
import ListingFilters from './ListingFilters';
import { pluralize } from '@/utils/formatters';
import { distanceKm } from '@/utils/distance';

/**
 * AdvocateListing — client-side filterable directory grid.
 * Receives the full lawyer list + initial filters from the server page.
 *
 * @param {object} props
 * @param {Array} props.advocates
 * @param {{query?:string,service?:string,city?:string}} [props.initial]
 * @param {boolean} [props.showFilters=true]   hide the filter bar on focused pages
 * @param {string} [props.emptyTitle]          heading for the empty state
 * @param {string} [props.emptyMessage]        supporting text for the empty state
 * @param {import('react').ReactNode} [props.emptyAction]  custom empty-state CTA
 */
const EMPTY = { query: '', service: '', subService: '', court: '', city: '', sort: 'relevance', radius: '' };

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

/** Nearest-first, keeping lawyers without a known distance at the end. */
function sortByDistance(list) {
  return [...list].sort((a, b) => {
    if (a._distance == null) return 1;
    if (b._distance == null) return -1;
    return a._distance - b._distance;
  });
}

export default function AdvocateListing({
  advocates,
  initial = {},
  showFilters = true,
  floatFilters = false,
  cities,
  emptyTitle,
  emptyMessage,
  emptyAction,
}) {
  const [filters, setFilters] = useState({ ...EMPTY, ...initial });

  // The searcher's coordinates (from the browser or a typed pincode) plus a
  // small bit of UI state for the location controls.
  const [userLocation, setUserLocation] = useState(null); // { lat, lng }
  const [locationLabel, setLocationLabel] = useState('');
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  const onChange = (patch) => setFilters((prev) => ({ ...prev, ...patch }));
  const onReset = () => {
    setFilters(EMPTY);
    clearLocation();
  };

  function clearLocation() {
    setUserLocation(null);
    setLocationLabel('');
    setLocationError('');
    setFilters((prev) => ({ ...prev, radius: '' }));
  }

  /** Ask the browser for the user's current position. */
  function useMyLocation() {
    setLocationError('');
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationError('Location is not supported on this device. Try a pincode.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationLabel('Your location');
        setLocating(false);
      },
      () => {
        setLocationError('Location access denied. Enter your pincode instead.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const hasActiveFilters =
    Boolean(
      filters.query || filters.service || filters.subService || filters.court || filters.city
    ) || filters.sort !== 'relevance' || Boolean(userLocation);

  const results = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    const cityFilter = filters.city.trim().toLowerCase();
    const radius = Number(filters.radius) || 0;

    let filtered = advocates.filter((a) => {
      // Free-text query matches name, tagline, legal services OR the courts the
      // lawyer practises in (e.g. "supreme court").
      const matchesQuery =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.tagline?.toLowerCase().includes(q) ||
        a.specializations?.some((s) => s.toLowerCase().includes(q)) ||
        a.courts?.some((c) => c.toLowerCase().includes(q));
      const matchesService =
        !filters.service || a.specializations?.includes(filters.service);
      const matchesSubService =
        !filters.subService || a.subSpecializations?.includes(filters.subService);
      const matchesCourt =
        !filters.court || a.courts?.includes(filters.court);
      // City matches the lawyer's base city OR any city they also work in.
      const matchesCity =
        !cityFilter ||
        a.city?.toLowerCase() === cityFilter ||
        a.practiceCities?.some((c) => c.toLowerCase() === cityFilter);
      return matchesQuery && matchesService && matchesSubService && matchesCourt && matchesCity;
    });

    // Distance: attach how far each lawyer is from the searcher, then (if a
    // radius is chosen) drop anyone outside it. Lawyers without geocoded
    // coordinates simply have no distance and fall out of a radius filter.
    if (userLocation) {
      filtered = filtered.map((a) => {
        const loc = a.office?.location;
        const d =
          loc && typeof loc.lat === 'number' && typeof loc.lng === 'number'
            ? distanceKm(userLocation.lat, userLocation.lng, loc.lat, loc.lng)
            : null;
        return { ...a, _distance: d };
      });
      if (radius > 0) {
        filtered = filtered.filter((a) => a._distance != null && a._distance <= radius);
      }
    }

    // When the searcher has a location and hasn't chosen an explicit sort,
    // default to nearest-first — that's the intent behind a distance search.
    if (userLocation && filters.sort === 'relevance') {
      return sortByDistance(filtered);
    }
    return sortAdvocates(filtered, filters.sort);
  }, [advocates, filters, userLocation]);

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
            cities={cities}
            userLocation={userLocation}
            locationLabel={locationLabel}
            locating={locating}
            locationError={locationError}
            onUseMyLocation={useMyLocation}
            onClearLocation={clearLocation}
          />

          <div className="flex items-center justify-between">
            <p className="text-sm text-ink/60">
              <span className="font-semibold text-ink">{results.length}</span>{' '}
              {pluralize(results.length, 'lawyer').replace(`${results.length} `, '')} found
              {userLocation && filters.radius ? ` within ${filters.radius} km` : ''}
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
            {emptyTitle || (hasActiveFilters ? 'No lawyers match your filters' : 'No lawyers listed yet')}
          </h3>
          <p className="mt-1 max-w-sm text-sm text-ink/55">
            {emptyMessage ||
              (userLocation && filters.radius
                ? `No lawyers found within ${filters.radius} km. Try a larger distance.`
                : hasActiveFilters
                ? 'Try broadening your search — remove a filter or search a different city or legal service.'
                : 'No lawyer has been added here yet. Check back soon or explore other legal services.')}
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
