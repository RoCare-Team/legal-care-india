'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui';
import AdvocateGridCard from '@/components/cards/AdvocateGridCard';
import { advocateRates } from '@/constants/callRates';

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
 */
export default function AdvocateGrid({
  advocates,
  eyebrow,
  title,
  note,
  actionHref,
  actionLabel,
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

  // A second row only once the first is full. Below that a single row of two
  // or three cards is the whole band, and forcing two rows would leave an
  // empty one under it.
  const rows = advocates.length > columns ? 2 : 1;

  const sorted = useMemo(() => sortAdvocates(advocates, sort), [advocates, sort]);

  // The desktop grid reads in its natural order; the rail has to be re-threaded
  // for a track that fills columns top-then-bottom.
  const ordered = useMemo(
    () => (isDesktop ? sorted.slice(0, DESKTOP_SLOTS).map((advocate) => ({ advocate }))
      : railOrder(sorted, columns, rows)),
    [sorted, isDesktop, columns, rows]
  );

  // Nothing to order with two cards on screen; the control would be furniture.
  const showSort = advocates.length > 2;
  // Only the rail slides, so only the rail gets arrows — including on a phone,
  // where a swipe is the least discoverable gesture on the page.
  const showArrows = !isDesktop && advocates.length > columns * rows;

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
          {eyebrow && (
            <p className="font-display text-xl font-bold text-ink sm:text-2xl">{eyebrow}</p>
          )}
          {title && (
            <p className="mt-0.5 text-[14px] text-ink/60">
              {title}
              {note && <span className="ml-1.5 text-ink/40">· {note}</span>}
            </p>
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

          {/* The way out first, the arrows after it. They travel as one group
              rather than as loose children of the header row, whose own
              justification would otherwise spread them apart and leave the two
              smallest targets marooned in its busiest stretch. */}
          <div className="flex shrink-0 items-center gap-2">
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
