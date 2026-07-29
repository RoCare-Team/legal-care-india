import Link from 'next/link';
import Image from 'next/image';
import { Scale } from 'lucide-react';
import CitySkyline from './CitySkyline';

/**
 * CityCard — a compact tile for the city grids and rail.
 *
 * One bordered card holding the landmark and the city's name together, so the
 * two read as a single object rather than a picture with a caption drifting
 * beneath it. The photo is square and fills the card's width, which keeps a row
 * of them aligned whatever the column width works out to.
 *
 * The photos come from a hundred different sources and clash at this size, so a
 * faint navy wash sits over each one — that wash is what makes them read as one
 * set.
 *
 * Under the name sits how many lawyers have actually registered there, so the
 * tiles say something rather than only naming places. A city with none shows
 * "Coming soon" instead of a bare zero — the same fact, without reading as a
 * dead end.
 *
 * @param {object} props
 * @param {import('@/data/cities').CITIES[number]} props.city
 * @param {number} [props.count]  lawyers registered in this city
 */
export default function CityCard({ city, count }) {
  const { slug, name, state, image } = city;
  const has = typeof count === 'number' && count > 0;

  return (
    <Link
      href={`/${slug}`}
      title={`Lawyers in ${name}, ${state}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink/12 bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/45 hover:shadow-card"
    >
      <span className="relative grid aspect-[4/3] w-full place-items-center overflow-hidden bg-muted">
        {image ? (
          <>
            <Image
              src={image}
              alt=""
              fill
              sizes="160px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* The photos come from a hundred different sources and clash at
                this size; a faint navy wash is what makes them read as one set. */}
            <span className="absolute inset-0 bg-primary/10 mix-blend-multiply" aria-hidden="true" />
          </>
        ) : (
          <CitySkyline className="w-3/4" />
        )}

        {/* The count rides on the image, where it does not compete with the
            name for the card's two lines of text. */}
        <span
          className={`absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[10px] font-bold backdrop-blur-sm ${
            has ? 'bg-primary/85 text-white' : 'bg-ink/45 text-white/90'
          }`}
        >
          {has && <Scale className="h-2.5 w-2.5" aria-hidden="true" />}
          {has ? `${count} ${count === 1 ? 'lawyer' : 'lawyers'}` : 'Coming soon'}
        </span>
      </span>

      <span className="flex flex-1 flex-col justify-center px-2 py-2.5 text-center">
        {/* Two lines, so "Thiruvananthapuram" is not cut to "Thiruvanantha…" */}
        <span className="line-clamp-2 text-sm font-bold leading-tight text-ink/85 transition-colors group-hover:text-primary">
          {name}
        </span>
        <span className="mt-0.5 truncate text-[11px] font-medium text-ink/45">{state}</span>
      </span>
    </Link>
  );
}
