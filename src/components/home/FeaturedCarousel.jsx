'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import AdvocateCard from '@/components/cards/AdvocateCard';

/**
 * FeaturedCarousel — horizontal slider of lawyer cards. Shows 3 per view on
 * desktop (2 on tablet, ~1 on mobile) and slides sideways when there are more,
 * instead of wrapping onto new rows. Arrows on desktop; swipe/scroll elsewhere.
 *
 * @param {object} props
 * @param {Array} props.advocates
 */
export default function FeaturedCarousel({ advocates }) {
  const trackRef = useRef(null);

  const scroll = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector('[data-card]');
    const step = card ? card.offsetWidth + 24 /* gap-6 */ : el.clientWidth * 0.9;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  // Two cards to a view now, so anything past two is worth an arrow.
  const showArrows = advocates.length > 2;

  return (
    <div className="relative mt-6">
      {showArrows && (
        <>
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Previous lawyers"
            className="absolute -left-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-primary text-white shadow-card transition-colors hover:bg-primary-dark lg:grid"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Next lawyers"
            className="absolute -right-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-primary text-white shadow-card transition-colors hover:bg-primary-dark lg:grid"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {advocates.map((advocate) => (
          <div
            key={advocate.legalCareId || advocate._id || advocate.slug}
            data-card
            className="w-[92%] shrink-0 snap-start lg:w-[calc((100%-1.5rem)/2)]"
          >
            <AdvocateCard advocate={advocate} />
          </div>
        ))}
      </div>
    </div>
  );
}
