import Link from 'next/link';
import Image from 'next/image';
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
 * @param {object} props
 * @param {import('@/data/cities').CITIES[number]} props.city
 */
export default function CityCard({ city }) {
  const { slug, name, state, image } = city;

  return (
    <Link
      href={`/${slug}`}
      title={`Lawyers in ${name}, ${state}`}
      className="group flex h-full flex-col rounded-2xl border border-ink/12 bg-surface p-2 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/45 hover:shadow-card"
    >
      <span className="relative grid aspect-square w-full place-items-center overflow-hidden rounded-xl bg-muted">
        {image ? (
          <>
            <Image src={image} alt="" fill sizes="152px" className="object-cover" />
            <span className="absolute inset-0 bg-primary/10 mix-blend-multiply" aria-hidden="true" />
          </>
        ) : (
          <CitySkyline className="w-3/4" />
        )}
      </span>

      {/* Two lines, so "Thiruvananthapuram" is not cut to "Thiruvanantha…" */}
      <span className="mt-2.5 line-clamp-2 px-1 pb-1 text-sm font-bold leading-tight text-ink/85 transition-colors group-hover:text-primary">
        {name}
      </span>
    </Link>
  );
}
