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

  const showArrows = advocates.length > 3;

  return (
    <div className="mt-8">
      {showArrows && (
        <div className="mb-4 hidden justify-end gap-2 lg:flex">
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Previous lawyers"
            className="grid h-10 w-10 place-items-center rounded-full border border-ink/10 bg-surface text-ink/60 shadow-sm transition-colors hover:border-primary hover:text-primary"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Next lawyers"
            className="grid h-10 w-10 place-items-center rounded-full border border-ink/10 bg-surface text-ink/60 shadow-sm transition-colors hover:border-primary hover:text-primary"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}

      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {advocates.map((advocate) => (
          <div
            key={advocate.legalCareId || advocate._id || advocate.slug}
            data-card
            className="w-[86%] shrink-0 snap-start sm:w-[47%] lg:w-[calc((100%-3rem)/3)]"
          >
            <AdvocateCard advocate={advocate} />
          </div>
        ))}
      </div>
    </div>
  );
}
