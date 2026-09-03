'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CityCard from '@/components/cards/CityCard';

/**
 * CityTileRail — the city tiles as a single row that scrolls sideways.
 *
 * `grid-flow-col` on one row keeps every tile on the same line however many
 * cities there are; a plain wrapping grid would reflow into as many rows as the
 * width allowed, which is not the band this is meant to be.
 *
 * Arrows appear only when the tiles actually overrun the rail; below that they
 * would point at nothing. Swipe and trackpad scrolling work regardless.
 *
 * @param {object} props
 * @param {Array} props.cities
 * @param {Record<string, number>} [props.counts]  lawyers per city name
 */
export default function CityTileRail({ cities = [], counts = {} }) {
  const trackRef = useRef(null);

  const scroll = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector('[data-tile]');
    const step = card ? (card.offsetWidth + 16) * 3 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  if (!cities.length) return null;

  // Roughly eight tiles fit a desktop rail on one line at this size.
  const showArrows = cities.length > 8;

  return (
    <div className="mt-6">
      {/* Heading and arrows share one row above the rail. The arrows used to
          float over the tiles at the sides and were hidden below `lg`, so on a
          phone nothing signalled that the row scrolled. */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold text-ink sm:text-xl">
          Browse lawyers by city
        </h2>

        {/* The way out sits with the heading rather than in a bar above it: it
            is about these tiles, and a lone right-aligned button over the row
            read as belonging to whatever came before. */}
        <Link
          href="/cities"
          className="group ml-auto inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary-dark"
        >
          View all cities
          <ChevronRight
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
        {showArrows && (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => scroll(-1)}
              aria-label="Previous cities"
              className="grid h-9 w-9 place-items-center rounded-full border border-ink/10 bg-surface text-primary shadow-sm transition-colors hover:border-primary/30 hover:bg-primary hover:text-white"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              aria-label="More cities"
              className="grid h-9 w-9 place-items-center rounded-full border border-ink/10 bg-surface text-primary shadow-sm transition-colors hover:border-primary/30 hover:bg-primary hover:text-white"
            >
              <ChevronRight className="h-4.5 w-4.5" />
            </button>
          </div>
        )}
      </div>

      {/* Bled to the page gutter and given that gutter back as the track's own
          padding, so the tiles' shadow and their lift on hover are not sliced
          off flat by the scroll container at either edge.

          `scroll-px` has to match that padding. Snap alignment is measured from
          the scrollport's *border* box unless scroll-padding says otherwise, so
          without it every snap pulled the leading tile flush against the screen
          edge — the padding only showed until the first scroll.

          Two tiles to a phone screen, sized as a share of the track rather than
          a fixed width: at 8.5rem a third tile was left half-cut at the edge,
          which reads as the row being broken rather than scrollable. */}
      <div
        ref={trackRef}
        className="-mx-4 grid snap-x snap-mandatory auto-cols-[calc((100%-3rem)/2)] grid-flow-col grid-rows-1 gap-4 overflow-x-auto scroll-smooth scroll-px-4 px-4 py-2 [scrollbar-width:none] sm:-mx-6 sm:auto-cols-[10rem] sm:scroll-px-6 sm:px-6 lg:-mx-8 lg:scroll-px-8 lg:px-8 [&::-webkit-scrollbar]:hidden"
      >
        {cities.map((city) => (
          <div key={city.slug} data-tile className="snap-start">
            <CityCard city={city} count={counts[city.name] || 0} />
          </div>
        ))}
      </div>
    </div>
  );
}
