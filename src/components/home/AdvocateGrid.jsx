'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { Button } from '@/components/ui';
import AdvocateGridCard from '@/components/cards/AdvocateGridCard';
import { advocateRates } from '@/constants/callRates';
import { useLocation } from '@/components/location/LocationProvider';
import { usePresence } from '@/components/consultation/PresenceProvider';

/**
 * Sort orders offered here, in the order they are shown. The same ones the
 * full directory offers, so a visitor who follows "Find all lawyers" finds
 * the control they just used still there and still meaning the same thing.
 */
const SORTS = [
  { value: 'relevance', label: 'Most relevant' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'experience', label: 'Most experienced' },
  { value: 'fee-low', label: 'Rate: low to high' },
  { value: 'fee-high', label: 'Rate: high to low' },
];

/**
 * What a lawyer costs, for the two fee sorts: their cheapest live per-minute
 * rate, falling back to the flat office fee for anyone who offers no live
 * channel at all.
 */
function feeOf(advocate) {
  const rates = Object.values(advocateRates(advocate)).filter((r) => r > 0);
  return rates.length ? Math.min(...rates) : Number(advocate.consultationFee) || 0;
}

/** Columns in a view, per breakpoint — must match the track's `auto-cols`. */
const COLUMNS_BY_WIDTH = [
  { min: 1024, columns: 3 },
  { min: 640, columns: 2 },
  { min: 0, columns: 1 },
];

/**
 * Re-thread the list so a two-row, column-filling track reads left to right.
 *
 * `grid-flow-col` fills each column top-then-bottom, which puts lawyers 1 and 2
 * one above the other and 3 in the next column — the eye expects 1, 2, 3 across
 * the top and the rest beneath them. This walks each viewful (columns × rows)
 * in the order the grid consumes them, taking the top of every column first and
 * its bottom second, so what lands on screen is the row-major layout a reader
 * assumes.
 *
 * A half-filled bottom row gets explicit holes rather than being left short.
 * Without them the grid simply packs on: five lawyers across three columns
 * would collapse into two full columns and a stray, instead of three across the
 * top and two beneath.
 *
 * @param {Array} list
 * @param {number} columns  how many fit a view at the current width
 * @param {number} rows     1 while there are too few to need a second row
 * @returns {Array<{advocate?: object}>}  a hole is an entry with no advocate
 */
function railOrder(list, columns, rows) {
  if (rows < 2 || columns < 2) return list.map((advocate) => ({ advocate }));

  const perPage = columns * rows;
  const out = [];
  for (let start = 0; start < list.length; start += perPage) {
    const page = list.slice(start, start + perPage);
    // Columns this page actually reaches — an all-but-empty last page must not
    // trail empty columns the visitor can scroll into.
    const used = Math.min(columns, page.length);
    for (let c = 0; c < used; c += 1) {
      out.push({ advocate: page[c] });
      out.push(page[columns + c] ? { advocate: page[columns + c] } : {});
    }
  }
  return out;
}

/**
 * Order a copy of the list. Never mutates — the incoming array is the server's,
 * and re-sorting it in place would leave the original order unrecoverable when
 * the visitor switches back to "Most relevant".
 */
function sortAdvocates(list, sort) {
  const copy = [...list];
  switch (sort) {
    case 'rating':
      return copy.sort((a, b) => b.rating - a.rating);
    case 'experience':
      return copy.sort((a, b) => b.experience - a.experience);
    // Lawyers who quote nothing sort last either way: an unpriced profile is
    // not the cheapest one, it is one you have to ask.
    case 'fee-low':
      return copy.sort((a, b) => (feeOf(a) || Infinity) - (feeOf(b) || Infinity));
    case 'fee-high':
      return copy.sort((a, b) => feeOf(b) - feeOf(a));
    default:
      // Relevance = the order the server sent (newest first), untouched.
      return copy;
  }
}

/**
 * How many cards the band can hold, and so how many the location swap asks for.
 * Six fill the desktop grid; the rail on a narrower screen slides through the
 * rest, which is why this is not simply six.
 */
const LOCATION_LIMIT = 12;

/**
 * The heading for a band that has been narrowed to where the visitor is.
 *
 * `scope` comes back from the API and says how firm the match actually was, and
 * the wording follows it exactly. A band that quietly says "in Gurgaon" while
 * showing lawyers from three states along is worse than one that never
 * mentioned the city — the visitor believes it, calls one of them, and finds
 * out the hard way.
 *
 * @param {{scope: string, place: string}} nearby
 * @param {{label?: string}} location
 * @returns {{title: string, note: string}|null}  null → keep what the page sent
 */
function locationHeading(nearby, location) {
  const here = location?.label || 'you';
  switch (nearby?.scope) {
    case 'city':
    case 'state':
      return { title: `Verified lawyers in ${nearby.place}`, note: 'nearest first' };
    case 'nearby':
      return { title: `Verified lawyers near ${here}`, note: 'nearest first' };
    // 'all' — nobody within reach of this visitor. The band falls back to the
    // whole directory, and says so rather than dressing it up as a local result.
    case 'all':
      return {
        title: `No lawyer listed near ${here} yet — showing lawyers from across India`,
        note: 'newest first',
      };
    default:
      return null;
  }
}

/**
 * The same heading with "online" worked into it.
 *
 * Rewriting the caller's words rather than taking a second prop, because the
 * two forms have to stay one sentence: "Verified lawyers in Delhi" becomes
 * "Top online lawyers in Delhi", and a band with no city keeps its own name
 * with "online" simply added.
 *
 * @param {string} eyebrow
 * @returns {string}
 */
function onlineHeading(eyebrow) {
  const inCity = eyebrow.match(/\bin\s+(.+)$/i);
  return inCity ? `Top online lawyers in ${inCity[1]}` : 'Top online lawyers';
}

/**
 * AdvocateGrid — the home page's "Advocate listing" band, as a sliding rail.
 *
 * On a desktop it is a fixed shortlist: six lawyers, three across and two
 * down, static. This band is a taste of the directory, not the directory
 * itself — the rest are what "Find all lawyers" is for, and a new
 * registration simply joins the pool the six are drawn from.
 *
 * Narrower screens get the same cards as a sliding rail instead, two rows deep,
 * because sliding is how a small viewport shows more without growing a column
 * of cards that pushes the rest of the page out of reach.
 *
 * Sorting is presentation only. The list arrives whole from the server and is
 * merely reordered here — nothing is fetched, filtered or dropped, so the same
 * lawyers are on screen whichever order is chosen.
 *
 * @param {object} props
 * @param {Array} props.advocates
 * @param {string} [props.eyebrow]      small gold line above the title
 * @param {string} [props.title]        what this band is
 * @param {string} [props.note]         quiet qualifier after the title
 * @param {string} [props.actionHref]   the way out to the full directory
 * @param {string} [props.actionLabel]
 * @param {boolean} [props.locationAware]  swap the list for the visitor's own
 *   city once they allow the browser's location prompt. Off by default, and
 *   off on a city page, where the band is already scoped to a place.
 */
export default function AdvocateGrid({
  advocates,
  eyebrow,
  title,
  note,
  actionHref,
  actionLabel,
  locationAware = false,
}) {
  const [sort, setSort] = useState('relevance');
  const trackRef = useRef(null);

  // How many columns are on screen. Starts at the desktop count so the server
  // renders the layout most visitors get, then corrects itself on mount —
  // there is no width to measure until the browser has one.
  const [columns, setColumns] = useState(3);

  useEffect(() => {
    const read = () => {
      const width = window.innerWidth;
      setColumns(COLUMNS_BY_WIDTH.find((b) => width >= b.min)?.columns ?? 1);
    };
    read();
    window.addEventListener('resize', read);
    return () => window.removeEventListener('resize', read);
  }, []);

  // On a desktop this band is a fixed shortlist, not a rail: six lawyers, three
  // across and two down, and the rest are what "Find all lawyers" is for. A
  // seventh registration simply joins the pool the six are drawn from. Narrower
  // screens keep the rail, where sliding is how a small viewport shows more.
  const isDesktop = columns >= 3;
  const DESKTOP_SLOTS = 6;

  // Where the visitor is, if they allowed the browser's prompt on arrival or
  // picked a place in the header. Read even when this band is not location
  // aware — the hook is safe outside the provider and must not be called
  // conditionally.
  const { location, openPicker } = useLocation();

  // The visitor's own lawyers, once fetched. `null` until then, which is why
  // the band paints the newest-first list the server sent and swaps rather
  // than showing a spinner: the cards underneath are real lawyers, not a
  // placeholder, and a band that is worth reading should not be blanked while
  // a better version of it loads.
  const [nearby, setNearby] = useState(null);

  useEffect(() => {
    if (!locationAware || !location) {
      setNearby(null);
      return undefined;
    }

    const params = new URLSearchParams({
      city: location.city || '',
      state: location.state || '',
      limit: String(LOCATION_LIMIT),
    });
    // Coordinates order every answer and rescue the ones no place name matched
    // — a phone reports "Gurugram" where the lawyer typed "Gurgaon".
    if (Number.isFinite(location.lat) && Number.isFinite(location.lng)) {
      params.set('lat', String(location.lat));
      params.set('lng', String(location.lng));
    }

    const controller = new AbortController();
    fetch(`/api/advocates/nearby?${params}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data?.advocates) && data.advocates.length) setNearby(data);
      })
      .catch(() => {
        /* offline or aborted — the band keeps the list the page shipped */
      });

    return () => controller.abort();
  }, [locationAware, location]);

  // From here on the band works off `list`, which is the visitor's city when
  // there is one and the page's own list otherwise.
  const list = nearby?.advocates?.length ? nearby.advocates : advocates;
  const heading = nearby ? locationHeading(nearby, location) : null;

  // A second row only once the first is full. Below that a single row of two
  // or three cards is the whole band, and forcing two rows would leave an
  // empty one under it.
  const rows = list.length > columns ? 2 : 1;

  // Who is reachable this second. The same poll the cards' own badges read, so
  // the heading and the badges can never disagree — and `null` until the first
  // one lands, which is what keeps the band from claiming anyone is online
  // before it has been told.
  const presence = usePresence();

  // How many of these lawyers that actually is.
  const onlineCount = useMemo(() => {
    if (!presence) return 0;
    return list.filter((a) => presence.has(String(a._id || a.id || ''))).length;
  }, [list, presence]);

  const sorted = useMemo(() => {
    const byChosenOrder = sortAdvocates(list, sort);
    // Online first, but only while the visitor has not asked for an order of
    // their own: someone who picked "Highest rated" wants the highest rated at
    // the top, not the highest rated who happens to be at their desk.
    //
    // Within each group the chosen order is untouched, so this is a partition
    // rather than a re-sort — and before the first poll lands nobody counts as
    // online, which leaves the order exactly as it was.
    if (sort !== 'relevance' || !presence) return byChosenOrder;
    const isOnline = (a) => presence.has(String(a._id || a.id || ''));
    return [
      ...byChosenOrder.filter(isOnline),
      ...byChosenOrder.filter((a) => !isOnline(a)),
    ];
  }, [list, sort, presence]);

  // The desktop grid reads in its natural order; the rail has to be re-threaded
  // for a track that fills columns top-then-bottom.
  const ordered = useMemo(
    () => (isDesktop ? sorted.slice(0, DESKTOP_SLOTS).map((advocate) => ({ advocate }))
      : railOrder(sorted, columns, rows)),
    [sorted, isDesktop, columns, rows]
  );

  // The order actually on screen, in the band's own words.
  const orderNote =
    onlineCount > 0 && sort === 'relevance'
      ? 'online first'
      : heading
        ? heading.note
        : note;

  // Nothing to order with two cards on screen; the control would be furniture.
  const showSort = list.length > 2;
  // Only the rail slides, so only the rail gets arrows — including on a phone,
  // where a swipe is the least discoverable gesture on the page.
  const showArrows = !isDesktop && list.length > columns * rows;

  // Scroll by exactly one card plus its gap, so a click always lands the next
  // card flush against the edge rather than halfway across it.
  const scroll = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector('[data-card]');
    const gap = parseFloat(getComputedStyle(el).columnGap) || 20;
    const step = card ? card.offsetWidth + gap : el.clientWidth * 0.9;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  return (
    <div>
      {/* Heading on the left, the controls on the right. On a phone the two
          stack and the controls spread across their own line — sort on the
          left, the way out on the right — rather than crowding the title. */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          {(heading?.title || eyebrow) && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">
                {/* "Top online lawyers" only while some of them are. The claim
                    is checked against the presence poll rather than assumed:
                    a heading promising online lawyers over a row of grey
                    Offline badges is the one thing a directory cannot afford
                    to get wrong. */}
                {onlineCount > 0
                  ? onlineHeading(heading?.title || eyebrow)
                  : heading?.title || eyebrow}
              </h2>
              {onlineCount > 0 && (
                <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-emerald-600">
                  <span
                    className="h-2 w-2 rounded-full bg-emerald-500"
                    aria-hidden="true"
                  />
                  {onlineCount} online now
                </span>
              )}
            </div>
          )}
          {/* What order these are actually in. Once online-first has moved
              anyone, saying "newest first" or "nearest first" would describe an
              order the visitor is not looking at. */}
          {(orderNote || title) && (
            <p className="mt-0.5 text-[14px] text-ink/60">
              {title && !heading ? title : ''}
              {title && !heading && orderNote && (
                <span className="ml-1.5 text-ink/40">· {orderNote}</span>
              )}
              {(!title || heading) && orderNote}
            </p>
          )}
          {/* Where the band thinks the visitor is, and the way to say otherwise.
              A list narrowed to somewhere the visitor did not type needs to name
              that place and let them correct it — the location came from a
              browser prompt they may have tapped through without reading. */}
          {heading && location?.label && (
            <button
              type="button"
              onClick={openPicker}
              className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-primary/[0.07] px-2.5 py-1 text-[12px] font-semibold text-primary transition-colors hover:bg-primary/[0.12]"
            >
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {location.label}
              <span className="font-medium text-primary/60">· Change</span>
            </button>
          )}
        </div>

        <div className="ml-auto flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:flex-nowrap sm:justify-end sm:gap-2.5">
          {showSort && (
            <label className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-ink/12 bg-surface pl-3 pr-1 shadow-sm transition-colors focus-within:border-primary hover:border-ink/25">
              <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-ink/40" aria-hidden="true" />
              <span className="sr-only">Sort lawyers by</span>
              {/* A bare native select rather than the themed one: inside this
                  pill it supplies only the menu, so it carries no border, no
                  height and no background of its own. */}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="h-full cursor-pointer appearance-none bg-transparent pr-6 text-[13px] font-semibold text-ink focus:outline-none"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2.5'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3e%3c/svg%3e\")",
                  backgroundPosition: 'right 0.4rem center',
                  backgroundSize: '0.85rem',
                  backgroundRepeat: 'no-repeat',
                }}
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          {/* The way out and the arrows, as one group rather than as loose
              children of the header row — whose own justification would
              otherwise spread them apart and leave the two smallest targets
              marooned in its busiest stretch.

              On a phone the group takes a line of its own under the sort pill
              and splits it: the way out on the left, under the pill, and the
              arrows hard right where the rail they scroll ends. The row's own
              `justify-between` cannot do this — it only spaces items that share
              a line, and here the sort pill has the line above to itself. From
              sm everything fits on one line and the group is just three
              controls in a row. */}
          <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:shrink-0">
            {actionHref && actionLabel && (
              <Button href={actionHref} variant="outline" size="sm" className="shrink-0">
                {actionLabel}
              </Button>
            )}

            {showArrows && (
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => scroll(-1)}
                  aria-label="Previous lawyers"
                  className="grid h-8 w-8 place-items-center rounded-xl border border-ink/12 bg-surface text-primary shadow-sm transition-colors hover:border-primary/40 hover:bg-primary hover:text-white active:bg-primary active:text-white sm:h-9 sm:w-9"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => scroll(1)}
                  aria-label="Next lawyers"
                  className="grid h-8 w-8 place-items-center rounded-xl border border-ink/12 bg-surface text-primary shadow-sm transition-colors hover:border-primary/40 hover:bg-primary hover:text-white active:bg-primary active:text-white sm:h-9 sm:w-9"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isDesktop ? (
        /* A plain, static grid — six slots, nothing to scroll. The negative
           margin and padding are still here so the cards' hover lift and
           shadow are not clipped by the section's own edges. */
        <div className="-mx-1 -my-2 grid grid-cols-3 gap-5 px-1 py-2">
          {ordered.map(({ advocate }) => (
            <AdvocateGridCard
              key={advocate.legalCareId || advocate._id || advocate.slug}
              advocate={advocate}
            />
          ))}
        </div>
      ) : (
        /* A rail up to two rows deep. `grid-flow-col` fills each column
           top-then-bottom before starting the next, so a viewful is shown at a
           time and the rest slide in — which is how a narrow screen shows more
           without growing a row that pushes the page down.

           The vertical padding and its matching negative margin give the cards'
           hover lift and shadow room to breathe; `overflow-x-auto` would
           otherwise slice both off flat at the track's edges. `snap-start`
           makes a swipe settle on a column rather than between two. */
        <div
          ref={trackRef}
          style={{ gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}
          className="-mx-1 -my-2 grid snap-x snap-mandatory grid-flow-col gap-4 overflow-x-auto scroll-smooth px-1 py-2 auto-cols-[100%] [scrollbar-width:none] sm:auto-cols-[calc((100%-1.25rem)/2)] sm:gap-5 [&::-webkit-scrollbar]:hidden"
        >
          {ordered.map((item, i) => (
            <div
              key={item.advocate?.legalCareId || item.advocate?._id || item.advocate?.slug || `gap-${i}`}
              data-card
              className="snap-start"
              // A hole keeps its column's slot open so the row above stays full
              // width; it holds nothing, so it is hidden from assistive tech.
              aria-hidden={item.advocate ? undefined : true}
            >
              {item.advocate && <AdvocateGridCard advocate={item.advocate} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
