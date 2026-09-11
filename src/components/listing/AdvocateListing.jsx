'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { filterAdvocates, sortAdvocates, planRank } from '@/lib/advocateSearch';
import { SearchX, Loader2, Rows3, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui';
import AdvocateListCard from '@/components/cards/AdvocateListCard';
import AdvocateGridCard from '@/components/cards/AdvocateGridCard';
import FilterSidebar from './FilterSidebar';
import { usePresence } from '@/components/consultation/PresenceProvider';
import { useLocation } from '@/components/location/LocationProvider';
import { pluralize } from '@/utils/formatters';
import { distanceKm } from '@/utils/distance';
import Select from '@/components/ui/Select';

/**
 * AdvocateListing — client-side filterable directory grid.
 * Receives the full lawyer list + initial filters from the server page.
 *
 * @param {object} props
 * @param {Array} props.advocates
 * @param {{query?:string,service?:string,city?:string}} [props.initial]
 * @param {boolean} [props.showFilters=true]   hide the filters on focused pages
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
  // Added with the sidebar. All four read fields the advocate record already
  // carries, so none of them needed a change to the API.
  consult: '',    // '' | 'chat' | 'audio' | 'video' | 'office'
  language: '',
  maxFee: '',     // ceiling on the cheapest live per-minute rate
  minRating: '',
};

/** Which rate field proves a lawyer offers a given way of consulting. */
const CONSULT_FIELD = {
  chat: 'chatRate',
  audio: 'audioRate',
  video: 'videoRate',
  office: 'consultationFee',
};

/**
 * The cheapest live per-minute rate, or null when a lawyer quotes none.
 *
 * Null is not zero: someone who has set no live rate is not free, they are
 * unpriced, and an "Under ₹25" filter must not sweep them in.
 */
function cheapestRate(a) {
  const rates = [a.chatRate, a.audioRate, a.videoRate]
    .map(Number)
    .filter((r) => Number.isFinite(r) && r > 0);
  return rates.length ? Math.min(...rates) : null;
}

/** Nearest-first, keeping lawyers without a known distance at the end. */
function sortByDistance(list) {
  // Paid plans still lead, as in every other sort; distance orders within them.
  const byDistance = (a, b) => {
    if (a._distance == null && b._distance == null) return 0;
    if (a._distance == null) return 1;
    if (b._distance == null) return -1;
    return a._distance - b._distance;
  };
  return [...list].sort((a, b) => planRank(b) - planRank(a) || byDistance(a, b));
}

/** Where the chosen layout is kept between visits. */
const VIEW_KEY = 'lci:listing-view';

/** How many more cards to reveal each time the visitor scrolls to the end. */
const BATCH_SIZE = 12;


export default function AdvocateListing({
  advocates,
  initial = {},
  showFilters = true,
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

  // 'list' is one lawyer per row, the full horizontal card; 'grid' is two
  // across in the compact card the home page uses. Read from storage on
  // mount rather than during render: the server has no localStorage, and
  // reading it in the initial state would hydrate to different markup.
  const [view, setView] = useState('list');

  useEffect(() => {
    const saved = window.localStorage.getItem(VIEW_KEY);
    if (saved === 'list' || saved === 'grid') setView(saved);
  }, []);

  const chooseView = (next) => {
    setView(next);
    try {
      window.localStorage.setItem(VIEW_KEY, next);
    } catch {
      // Private browsing can refuse to store; the choice still applies here.
    }
  };

  // Live online ids — the same source the card badges read, so the list and the
  // green dots can never disagree. `null` until the first poll lands.
  const presence = usePresence();

  // The searcher's coordinates (from the browser or a typed pincode) plus a
  // small bit of UI state for the location controls.
  const [userLocation, setUserLocation] = useState(null); // { lat, lng }
  const [locationLabel, setLocationLabel] = useState('');
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  // The location picked in the header — or detected on arrival, when the
  // visitor allowed the browser's prompt — sets the distances the cards show
  // and orders the list nearest-first. It does not narrow the list.
  //
  // It used to: the visitor's own city was pre-selected in the City filter, so
  // someone in Gurgaon opened "Find Lawyers" to 9 lawyers out of nearly 400 and
  // took that for the whole directory. The directory is the whole directory;
  // the nearby lawyers are simply at the top, and the City filter is there for
  // anyone who does want to narrow. A city carried in from the URL
  // (/lawyers?city=jaipur, or a city page) still arrives as a filter, because
  // there the visitor asked for it.
  const { location: pickedLocation } = useLocation();
  const appliedPickedRef = useRef('');

  useEffect(() => {
    if (!pickedLocation) return;
    const key = `${pickedLocation.lat},${pickedLocation.lng}`;
    if (appliedPickedRef.current === key) return;
    appliedPickedRef.current = key;
    setUserLocation({ lat: pickedLocation.lat, lng: pickedLocation.lng });
    setLocationLabel(pickedLocation.label || 'Your location');
    setLocationError('');
  }, [pickedLocation]);

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
        filters.availability ||
        filters.consult ||
        filters.language ||
        filters.maxFee ||
        filters.minRating
    ) ||
    filters.sort !== 'relevance' ||
    // A known location is not a filter until a radius narrows by it — saying
    // "filters applied" for a location that hides nothing sends people hunting
    // for something to clear.
    Boolean(userLocation && filters.radius);

  const results = useMemo(() => {
    const radius = Number(filters.radius) || 0;

    // Reachable right now, straight from the presence poll. Before it lands
    // nobody counts as online — the same rule the badges follow, so a lawyer is
    // never listed under "Online now" while their own card reads Offline.
    const isOnline = (a) => {
      if (presence === null) return false;
      const id = String(a.id || a._id || '');
      return Boolean(id) && presence.has(id);
    };

    // Name, service, matter, court and city are decided by the shared rules in
    // lib/advocateSearch, which GET /api/advocates runs too — so the app's
    // search and this one cannot answer the same query differently.
    let filtered = filterAdvocates(advocates, filters);

    // Availability is the exception, and stays here: on the web it is whatever
    // the presence poll last said, which is a fact about this browser tab and
    // not something a pure filter over a list could know.
    if (filters.availability) {
      const wantOnline = filters.availability === 'online';
      filtered = filtered.filter((a) => isOnline(a) === wantOnline);
    }

    // A way of consulting is offered when there is a rate against it. A
    // lawyer with no video rate is not a lawyer you can pay to video call.
    if (filters.consult) {
      const field = CONSULT_FIELD[filters.consult];
      if (field) filtered = filtered.filter((a) => Number(a[field]) > 0);
    }

    if (filters.language) {
      const want = String(filters.language).toLowerCase();
      filtered = filtered.filter((a) =>
        (a.languages || []).some((l) => String(l).toLowerCase() === want)
      );
    }

    if (filters.maxFee) {
      const ceiling = Number(filters.maxFee);
      filtered = filtered.filter((a) => {
        const rate = cheapestRate(a);
        return rate != null && rate <= ceiling;
      });
    }

    if (filters.minRating) {
      const floor = Number(filters.minRating);
      filtered = filtered.filter((a) => Number(a.rating) >= floor);
    }

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

  // Reveal the next batch as the sentinel nears the viewport — or once it is
  // already behind it. An IntersectionObserver alone only reports a *change*
  // in intersection, so a fast fling (or the footer's height on a phone) could
  // carry the zero-height sentinel from below the screen to above it in one
  // frame; it never "intersected", nothing fired, and the list stopped at the
  // first batch for good. The scroll check catches exactly that case.
  // Re-attaches on every change to visibleCount/length so it keeps firing
  // while the sentinel stays in view (a long screen can swallow several
  // batches at once).
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || visibleCount >= results.length) return undefined;

    const LOOKAHEAD = 1200;
    let done = false;
    const loadMore = () => {
      if (done) return;
      done = true;
      setVisibleCount((c) => Math.min(c + BATCH_SIZE, results.length));
    };
    const check = () => {
      if (el.getBoundingClientRect().top < window.innerHeight + LOOKAHEAD) loadMore();
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: `${LOOKAHEAD}px 0px` }
    );
    io.observe(el);

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        check();
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    // On attach, only fill a tall screen: if the sentinel is already behind the
    // viewport (the visitor is down at the footer), wait for them to scroll
    // rather than chaining through every batch in one go.
    if (el.getBoundingClientRect().top >= 0) check();

    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [visibleCount, results.length]);

  // The place the header line names. Only a place the list is actually
  // narrowed to: the visitor's own city, or a radius around where they are.
  // Where they merely are, with nothing narrowed, the list is still everyone —
  // "391 lawyers in Gurgaon" would claim otherwise.
  const scopeCity = filters.city || (userLocation && filters.radius ? locationLabel : '');

  return (
    // Filters beside the results, not above them. A bar across the top hid
    // every option behind a <select>; a column shows the practice areas and
    // the languages, which are the two things a visitor scans to decide what
    // to narrow by. Below lg the column would push the results off screen, so
    // FilterSidebar collapses itself to a button and a sheet.
    <div className="lg:grid lg:grid-cols-[264px_minmax(0,1fr)] lg:items-start lg:gap-6">
      {showFilters && (
        <FilterSidebar
          value={filters}
          onChange={onChange}
          onReset={onReset}
          hasActiveFilters={hasActiveFilters}
          cities={cities}
          advocates={advocates}
          userLocation={userLocation}
          locationLabel={locationLabel}
          locating={locating}
          locationError={locationError}
          onUseMyLocation={useMyLocation}
          onClearLocation={clearLocation}
        />
      )}

      <div className="min-w-0 space-y-6">
      {showFilters && (
        <div className="mt-4 lg:mt-0">
          <h2 className="font-display text-xl font-bold text-ink sm:text-[26px]">
            Find the Right Lawyer Near You
          </h2>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink/60">
              Showing <span className="font-semibold text-ink">{results.length}</span>{' '}
              verified {pluralize(results.length, 'lawyer').replace(`${results.length} `, '')}
              {scopeCity ? ` in ${scopeCity}` : ''}
              {userLocation && filters.radius ? ` within ${filters.radius} km` : ''}
            </p>

            <div className="flex shrink-0 items-center gap-3">
            {/* One lawyer per row, or two across. Hidden below sm, where the
                width decides for itself and the control would do nothing. */}
            <div
              role="group"
              aria-label="Layout"
              className="hidden items-center gap-0.5 rounded-xl border border-ink/12 bg-surface p-0.5 shadow-sm sm:flex"
            >
              {[
                { value: 'list', icon: Rows3, label: 'One per row' },
                { value: 'grid', icon: LayoutGrid, label: 'Two per row' },
              ].map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => chooseView(value)}
                  aria-pressed={view === value}
                  title={label}
                  aria-label={label}
                  className={`grid h-9 w-9 place-items-center rounded-lg transition-colors ${
                    view === value
                      ? 'bg-primary text-white'
                      : 'text-ink/45 hover:bg-primary/[0.06] hover:text-primary'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </button>
              ))}
            </div>

            {/* Sort stays with the results it reorders, not in the sidebar,
                which is for narrowing. */}
            <div className="flex shrink-0 items-center gap-2 text-[13px] text-ink/55">
              <span id="listing-sort-label">Sort by</span>
              <Select
                size="sm"
                value={filters.sort}
                onChange={(e) => onChange({ sort: e.target.value })}
                aria-labelledby="listing-sort-label"
                wrapperClassName="w-[184px]"
                className="font-semibold"
                options={[
                  { value: 'relevance', label: 'Relevance' },
                  { value: 'rating', label: 'Highest rated' },
                  { value: 'experience', label: 'Most experienced' },
                  { value: 'fee-low', label: 'Rate: low to high' },
                  { value: 'fee-high', label: 'Rate: high to low' },
                ]}
              />
            </div>
            </div>
          </div>
        </div>
      )}
      {results.length > 0 ? (
        <>
          {/* The same card the home page shows, at the density the visitor
              chose — one across on a phone whatever the toggle says. */}
          <div className={view === 'grid'
            ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5'
            : 'grid grid-cols-1 gap-4 sm:gap-5'}>
            {pageResults.map((advocate) => (
              view === 'grid' ? (
              <AdvocateGridCard
                key={advocate.legalCareId || advocate._id || advocate.slug}
                advocate={advocate}
              />
              ) : (
              <AdvocateListCard
                key={advocate.id || advocate._id || advocate.slug}
                advocate={advocate}
              />
              )
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
    </div>
  );
}
