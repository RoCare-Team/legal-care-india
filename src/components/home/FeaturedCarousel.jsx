'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui';
import AdvocateCard from '@/components/cards/AdvocateCard';

/**
 * FeaturedCarousel — horizontal slider of lawyer cards. Shows two per view on
 * desktop and roughly one on mobile, sliding sideways rather than wrapping.
 *
 * The arrows sit above the track rather than floating over its sides. Over the
 * sides they overlapped the cards, were hidden below `lg` — so a phone user had
 * no sign the row scrolled at all — and the left one sat outside the container,
 * where the page's own edge clipped it.
 *
 * The track is bled out to the container's padding and given that padding back
 * as its own. Without it the cards' shadow and their lift on hover were sliced
 * off flat by `overflow-x-auto` at both edges. That padding is also the small
 * gap either side of the card on a phone, where one card fills the view — a
 * sliver of the next one showing beside it read as a layout fault rather than
 * as an invitation to swipe.
 *
 * The header takes plain strings rather than ready-made JSX. Handing rendered
 * elements from a Server Component to a Client one sends them across the RSC
 * boundary, where React treats them as list children and asks for a `key`;
 * passing the words instead and building the markup here avoids that entirely.
 *
 * @param {object} props
 * @param {Array} props.advocates
 * @param {string} [props.eyebrow]      small gold line above the title
 * @param {string} [props.title]        what this row is
 * @param {string} [props.note]         quiet qualifier after the title
 * @param {string} [props.actionHref]   the way out to the full listing; its
 *   button sits immediately before the arrows so both share one line.
 * @param {string} [props.actionLabel]
 */
export default function FeaturedCarousel({
  advocates,
  eyebrow,
  title,
  note,
  actionHref,
  actionLabel,
}) {
  const trackRef = useRef(null);

  const scroll = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector('[data-card]');
    const step = card ? card.offsetWidth + 24 /* gap-6 */ : el.clientWidth * 0.9;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  // Two cards to a view, so anything past two is worth an arrow.
  const showArrows = advocates.length > 2;

  return (
    <div className="mt-6">
      {(title || actionHref || showArrows) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            {eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                {eyebrow}
              </p>
            )}
            {title && (
              <p className="mt-1 text-sm font-semibold text-ink/70 sm:text-base">
                {title}
                {note && <span className="ml-2 font-normal text-ink/45">{note}</span>}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {actionHref && actionLabel && (
              <Button href={actionHref} variant="outline" size="sm">
                {actionLabel}
              </Button>
            )}
            {showArrows && (
              <>
                <button
                  type="button"
                  onClick={() => scroll(-1)}
                  aria-label="Previous lawyers"
                  className="grid h-9 w-9 place-items-center rounded-full border border-ink/10 bg-surface text-primary shadow-sm transition-colors hover:border-primary/30 hover:bg-primary hover:text-white"
                >
                  <ChevronLeft className="h-4.5 w-4.5" />
                </button>
                <button
                  type="button"
                  onClick={() => scroll(1)}
                  aria-label="Next lawyers"
                  className="grid h-9 w-9 place-items-center rounded-full border border-ink/10 bg-surface text-primary shadow-sm transition-colors hover:border-primary/30 hover:bg-primary hover:text-white"
                >
                  <ChevronRight className="h-4.5 w-4.5" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div
        ref={trackRef}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth scroll-px-4 px-4 py-2 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:gap-6 sm:px-6 lg:-mx-8 lg:scroll-px-8 lg:px-8 [&::-webkit-scrollbar]:hidden"
      >
        {advocates.map((advocate) => (
          <div
            key={advocate.legalCareId || advocate._id || advocate.slug}
            data-card
            className="w-full shrink-0 snap-start sm:w-[70%] lg:w-[calc((100%-1.5rem)/2)]"
          >
            <AdvocateCard advocate={advocate} />
          </div>
        ))}
      </div>
    </div>
  );
}
