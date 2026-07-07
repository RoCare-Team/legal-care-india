import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { formatCompactNumber } from '@/utils/formatters';

/**
 * CityCard — compact city entry for the "Browse by City" grid.
 *
 * @param {object} props
 * @param {import('@/data/cities').CITIES[number]} props.city
 */
export default function CityCard({ city }) {
  const { slug, name, state, advocates } = city;

  return (
    <Link
      href={`/cities/${slug}`}
      className="group flex items-center gap-3 rounded-xl border border-ink/8 bg-surface px-4 py-3 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-card-hover"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-secondary/10 text-secondary">
        <MapPin className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-semibold text-ink group-hover:text-primary">
          {name}
        </span>
        <span className="block text-xs text-ink/55">
          {formatCompactNumber(advocates)}+ advocates · {state}
        </span>
      </span>
    </Link>
  );
}
