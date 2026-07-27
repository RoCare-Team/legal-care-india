'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, MapPin, ArrowRight } from 'lucide-react';

/**
 * Horizontal slider of "this subject, in this city" cards.
 *
 * Deliberately not the homepage CityCard: those tiles lead with a landmark
 * photograph, which suits "browse cities" and reads as tourism next to a
 * heading like "White Collar Crime lawyers by city". These cards carry the same
 * grammar as the matter cards already on the page — name, one supporting line,
 * a real count and a corner arrow — so the page reads as one system.
 *
 * @param {object} props
 * @param {Array<{slug:string, name:string, state:string, href:string, count:number}>} props.items
 * @param {string} props.subject  what is being counted, e.g. "White Collar Crime"
 */
export default function CitySlider({ items = [], subject }) {
  const trackRef = useRef(null);

  const scroll = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector('[data-card]');
    const step = card ? card.offsetWidth + 16 /* gap-4 */ : el.clientWidth * 0.9;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  if (!items.length) return null;
  const showArrows = items.length > 3;

  return (
    <div className="relative mt-6">
      {showArrows && (
        <>
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label={`Previous cities for ${subject}`}
            className="absolute -left-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-primary text-white shadow-card transition-colors hover:bg-primary-dark lg:grid"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label={`More cities for ${subject}`}
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
        {items.map((city) => (
          <div
            key={city.slug}
            data-card
            className="w-[64%] shrink-0 snap-start sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)] xl:w-[calc((100%-3rem)/4)]"
          >
            <Link
              href={city.href}
              title={`${subject} lawyers in ${city.name}`}
              className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-ink/8 bg-surface p-4 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-card-hover"
            >
              {/* Same gold hairline the matter cards draw on hover. */}
              <span
                className="pointer-events-none absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-accent to-primary transition-transform duration-300 group-hover:scale-x-100"
                aria-hidden="true"
              />

              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/[0.07] text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                <MapPin className="h-4 w-4" aria-hidden="true" />
              </span>

              <h3 className="mt-3 font-display text-[15px] font-bold leading-tight text-ink transition-colors group-hover:text-primary">
                {city.name}
              </h3>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-ink/35">
                {city.state}
              </p>

              <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                <span
                  className={`text-xs font-semibold ${
                    city.count > 0 ? 'text-primary' : 'text-ink/35'
                  }`}
                >
                  {city.count > 0
                    ? `${city.count} ${city.count === 1 ? 'lawyer' : 'lawyers'}`
                    : 'Be the first'}
                </span>
                <ArrowRight
                  className="h-4 w-4 shrink-0 text-ink/20 transition-all group-hover:translate-x-0.5 group-hover:text-primary"
                  aria-hidden="true"
                />
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
