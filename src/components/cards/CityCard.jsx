import Link from 'next/link';
import Image from 'next/image';
import { Landmark, ArrowUpRight } from 'lucide-react';
import { formatCompactNumber } from '@/utils/formatters';

/**
 * CityCard — compact tile for the "Browse by City" slider and grid.
 *
 * A light card with the city's landmark in a ringed circle and the name under
 * it. The photos come from a dozen different sources and clash badly at this
 * size, so each sits inside a gold-to-navy gradient ring with a faint navy wash
 * over it — that ring is what makes twelve mismatched photographs read as one
 * set.
 *
 * @param {object} props
 * @param {import('@/data/cities').CITIES[number]} props.city
 */
export default function CityCard({ city }) {
  const { slug, name, state, advocates, image } = city;

  return (
    <Link
      href={`/${slug}`}
      title={`${name}, ${state}`}
      className="group relative flex h-full flex-col items-center overflow-hidden rounded-2xl border border-ink/8 bg-surface px-3 pb-4 pt-6 text-center shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/25 hover:shadow-card-hover"
    >
      {/* Soft brand wash that only appears on hover, behind everything. */}
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/[0.07] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden="true"
      />

      {/* Corner arrow — quiet until hover. */}
      <span
        className="pointer-events-none absolute right-2.5 top-2.5 text-ink/0 transition-colors duration-300 group-hover:text-primary/45"
        aria-hidden="true"
      >
        <ArrowUpRight className="h-3.5 w-3.5" />
      </span>

      {/* Landmark — the city photo, cropped to a circle inside a gradient ring.
          Optimized and cached by Next.js so the browser never hits Wikimedia. */}
      <span className="relative rounded-full bg-gradient-to-br from-accent/70 via-accent/25 to-primary/35 p-[2.5px] transition-transform duration-300 group-hover:scale-105">
        <span className="relative grid h-[68px] w-[68px] place-items-center overflow-hidden rounded-full bg-muted ring-2 ring-surface">
          {image ? (
            <>
              <Image src={image} alt="" fill sizes="68px" className="object-cover" />
              {/* Unifies wildly different exposures across the row. */}
              <span
                className="absolute inset-0 bg-primary/10 mix-blend-multiply"
                aria-hidden="true"
              />
            </>
          ) : (
            <Landmark className="h-7 w-7 text-primary/60" aria-hidden="true" />
          )}
        </span>
      </span>

      <h3 className="mt-3.5 font-display text-[15px] font-bold leading-tight text-ink transition-colors group-hover:text-primary">
        {name}
      </h3>

      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-ink/35">{state}</p>

      <span className="mt-2.5 inline-flex items-center rounded-full bg-primary/[0.06] px-2.5 py-1 text-[11px] font-semibold text-primary ring-1 ring-inset ring-primary/10 transition-colors group-hover:bg-primary/10">
        {formatCompactNumber(advocates)}+ lawyers
      </span>
    </Link>
  );
}
