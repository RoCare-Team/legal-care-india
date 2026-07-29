'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import TestimonialCard from '@/components/cards/TestimonialCard';

/**
 * TestimonialsCarousel — horizontal slider of platform reviews. Shows three per
 * view on desktop, one on a phone, and slides sideways when there are more.
 *
 * Built on the same rules as the other two rails: arrows above the track at
 * every width, the track bled out to the page gutter and given it back as its
 * own padding so the cards' shadow is not sliced off, and `scroll-px` matching
 * that padding — snap alignment ignores padding otherwise, and the leading card
 * lands flush against the edge of the screen the moment the row is scrolled.
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

  // One card to a phone screen, so anything past one is worth an arrow there.
  const showArrows = testimonials.length > 1;

  return (
    <div className="mt-2">
      {showArrows && (
        <div className="mb-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Previous reviews"
            className="grid h-9 w-9 place-items-center rounded-full border border-ink/10 bg-surface text-primary shadow-sm transition-colors hover:border-primary/30 hover:bg-primary hover:text-white"
          >
            <ChevronLeft className="h-4.5 w-4.5" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Next reviews"
            className="grid h-9 w-9 place-items-center rounded-full border border-ink/10 bg-surface text-primary shadow-sm transition-colors hover:border-primary/30 hover:bg-primary hover:text-white"
          >
            <ChevronRight className="h-4.5 w-4.5" />
          </button>
        </div>
      )}

      <div
        ref={trackRef}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth scroll-px-4 px-4 py-2 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:gap-6 sm:px-6 lg:-mx-8 lg:scroll-px-8 lg:px-8 [&::-webkit-scrollbar]:hidden"
      >
        {testimonials.map((testimonial) => (
          <div
            key={testimonial.id}
            data-card
            className="w-full shrink-0 snap-start sm:w-[47%] lg:w-[calc((100%-3rem)/3)]"
          >
            <TestimonialCard testimonial={testimonial} />
          </div>
        ))}
      </div>
    </div>
  );
}
