'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import TestimonialCard from '@/components/cards/TestimonialCard';

/**
 * TestimonialsCarousel — horizontal slider of platform reviews. Shows 3 per
 * view on desktop and slides sideways when there are more.
 *
 * @param {object} props
 * @param {Array} props.testimonials
 */
export default function TestimonialsCarousel({ testimonials }) {
  const trackRef = useRef(null);

  const scroll = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector('[data-card]');
    const step = card ? card.offsetWidth + 24 : el.clientWidth * 0.9;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  const showArrows = testimonials.length > 3;

  return (
    <div className="mt-10">
      {showArrows && (
        <div className="mb-4 hidden justify-end gap-2 lg:flex">
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Previous reviews"
            className="grid h-10 w-10 place-items-center rounded-full border border-ink/10 bg-surface text-ink/60 shadow-sm transition-colors hover:border-primary hover:text-primary"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Next reviews"
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
        {testimonials.map((testimonial) => (
          <div
            key={testimonial.id}
            data-card
            className="w-[86%] shrink-0 snap-start sm:w-[47%] lg:w-[calc((100%-3rem)/3)]"
          >
            <TestimonialCard testimonial={testimonial} />
          </div>
        ))}
      </div>
    </div>
  );
}
