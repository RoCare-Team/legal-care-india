'use client';

import { useRef } from 'react';
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
 */
export default function CityTileRail({ cities = [] }) {
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
    <div className="relative mt-8">
      {showArrows && (
        <>
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Previous cities"
            className="absolute -left-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-primary text-white shadow-card transition-colors hover:bg-primary-dark lg:grid"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="More cities"
            className="absolute -right-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-primary text-white shadow-card transition-colors hover:bg-primary-dark lg:grid"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      <div
        ref={trackRef}
        className="grid snap-x snap-mandatory auto-cols-[8rem] grid-flow-col grid-rows-1 gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] sm:auto-cols-[9.5rem] [&::-webkit-scrollbar]:hidden"
      >
        {cities.map((city) => (
          <div key={city.slug} data-tile className="snap-start">
            <CityCard city={city} />
          </div>
        ))}
      </div>
    </div>
  );
}
