'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CityCard from '@/components/cards/CityCard';

/**
 * CitiesCarousel — horizontal slider of city cards. Six per view on desktop,
 * scaling down to two on a phone, sliding sideways rather than stacking a dozen
 * cities into rows that push the rest of the homepage down. Arrows on desktop;
 * swipe or trackpad-scroll elsewhere.
 *
 * @param {object} props
 * @param {Array} props.cities
 */
export default function CitiesCarousel({ cities }) {
  const trackRef = useRef(null);

  const scroll = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector('[data-card]');
    const step = card ? card.offsetWidth + 16 /* gap-4 */ : el.clientWidth * 0.9;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  const showArrows = cities.length > 6;

  return (
    <div className="relative mt-6">
      {/* Arrows sit on the track's edges rather than in a row of their own —
          that row cost ~55px of empty space between the heading and the cards. */}
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
            aria-label="Next cities"
            className="absolute -right-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-primary text-white shadow-card transition-colors hover:bg-primary-dark lg:grid"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {cities.map((city) => (
          <div
            key={city.slug}
            data-card
            className="w-[42%] shrink-0 snap-start sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-4rem)/5)] xl:w-[calc((100%-5rem)/6)]"
          >
            <CityCard city={city} />
          </div>
        ))}
      </div>
    </div>
  );
}
