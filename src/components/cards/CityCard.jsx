import Link from 'next/link';
import Image from 'next/image';
import { MapPin, ArrowUpRight } from 'lucide-react';
import { formatCompactNumber } from '@/utils/formatters';

/**
 * CityCard — image tile for the "Browse by City" grid. Shows a city photo with
 * a dark gradient overlay so the name + advocate count stay readable.
 *
 * @param {object} props
 * @param {import('@/data/cities').CITIES[number]} props.city
 */
export default function CityCard({ city }) {
  const { slug, name, state, advocates, image } = city;

  return (
    <Link
      href={`/${slug}`}
      className="group relative block h-36 overflow-hidden rounded-2xl border border-ink/8 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
    >
      {/* City photo — optimized + cached by Next.js so the browser never hits
          Wikimedia directly (no hotlink/rate-limit issues). */}
      {image && (
        <Image
          src={image}
          alt={`${name}, ${state}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
      )}

      {/* Readability gradient (also the fallback background) */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/70 to-primary/30" />

      {/* Hover arrow */}
      <span className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/15 text-white opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:opacity-100">
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </span>

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
        <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-white/75">
          <MapPin className="h-3 w-3" aria-hidden="true" />
          {state}
        </p>
        <h3 className="mt-0.5 font-display text-xl font-bold leading-tight">{name}</h3>
        <p className="mt-1 text-xs font-semibold text-accent">
          {formatCompactNumber(advocates)}+ advocates
        </p>
      </div>
    </Link>
  );
}
