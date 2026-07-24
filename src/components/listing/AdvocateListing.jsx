'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { SearchX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';
import AdvocateCard from '@/components/cards/AdvocateCard';
import ListingFilters from './ListingFilters';
import { usePresence } from '@/components/consultation/PresenceProvider';
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
const EMPTY = {
  query: '',
  service: '',
  subService: '',
  court: '',
  city: '',
  availability: '', // '' | 'online' | 'offline'
  sort: 'relevance',
  radius: '',
};

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

/** How many more cards to reveal each time the visitor scrolls to the end. */
const BATCH_SIZE = 12;

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
  // How many cards are currently on screen. Grows as the visitor scrolls; the
  // full `results` array is already in memory, so this is purely how much of it
  // we render at once.
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  // Watched by an IntersectionObserver — when it scrolls into view, load more.
  const sentinelRef = useRef(null);

  // Live online ids — the same source the card badges read, so the list and the
  // green dots can never disagree. `null` until the first poll lands.
  const presence = usePresence();

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
      filters.query ||
        filters.service ||
        filters.subService ||
        filters.court ||
        filters.city ||
        filters.availability
    ) || filters.sort !== 'relevance' || Boolean(userLocation);

  const results = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    const cityFilter = filters.city.trim().toLowerCase();
    const radius = Number(filters.radius) || 0;

    // Reachable right now, straight from the presence poll. Before it lands
    // nobody counts as online — the same rule the badges follow, so a lawyer is
    // never listed under "Online now" while their own card reads Offline.
    const isOnline = (a) => {
      if (presence === null) return false;
      const id = String(a.id || a._id || '');
      return Boolean(id) && presence.has(id);
    };

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
      const matchesAvailability =
        !filters.availability ||
        (filters.availability === 'online' ? isOnline(a) : !isOnline(a));
      return (
        matchesQuery &&
        matchesService &&
        matchesSubService &&
        matchesCourt &&
        matchesCity &&
        matchesAvailability
      );
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
  }, [advocates, filters, userLocation, presence]);

  // Collapse back to the first batch whenever the *filters* change — but not on
  // a presence poll, which also rebuilds `results` yet must not throw away how
  // far the visitor has already scrolled.
  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [filters, userLocation]);

  const pageResults = results.slice(0, visibleCount);
  const hasMore = visibleCount < results.length;

  // Reveal the next batch as the sentinel nears the viewport. Re-attaches on
  // every change to visibleCount/length so it keeps firing while the sentinel
  // stays in view (a long screen can swallow several batches at once).
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || visibleCount >= results.length) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((c) => Math.min(c + BATCH_SIZE, results.length));
        }
      },
      { rootMargin: '400px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visibleCount, results.length]);

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
              {filters.availability === 'online'
                ? ' online now'
                : filters.availability === 'offline'
                  ? ' offline'
                  : ''}
              {userLocation && filters.radius ? ` within ${filters.radius} km` : ''}
            </p>
          </div>
        </>
      )}

      {results.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {pageResults.map((advocate) => (
              <AdvocateCard key={advocate.id || advocate._id || advocate.slug} advocate={advocate} />
            ))}
          </div>

          {hasMore && (
            <>
              {/* The observer target sits a little above the loader so the next
                  batch is already loading before this row is reached. */}
              <div ref={sentinelRef} aria-hidden="true" />
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-ink/50" aria-live="polite">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Loading more lawyers…
              </div>
            </>
          )}
        </>
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
                : filters.availability === 'online'
                ? 'No lawyer is online at the moment. Switch to All Lawyers to browse everyone — you can still call, email or message them.'
                : filters.availability === 'offline'
                ? 'Every lawyer here is online right now. Switch to All Lawyers to see the full list.'
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
