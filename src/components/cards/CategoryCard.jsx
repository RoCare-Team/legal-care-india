import Link from 'next/link';
import { ArrowUpRight, Users } from 'lucide-react';
import { formatCompactNumber } from '@/utils/formatters';

/**
 * CategoryCard — a single legal-service entry in the categories grid.
 *
 * Built to the same grammar as the city tiles: centred content, the icon in a
 * gold-to-navy gradient ring, a navy count pill, and a quiet corner arrow that
 * only shows on hover. Two grids sitting a screen apart looked like two
 * different websites before.
 *
 * @param {object} props
 * @param {import('@/data/categories').CATEGORIES[number]} props.category
 */
export default function CategoryCard({ category }) {
  const { slug, name, icon: Icon, advocates, description } = category;

  return (
    <Link
      href={`/${slug}`}
      className="group relative flex h-full flex-col items-center overflow-hidden rounded-2xl border border-ink/8 bg-surface px-4 pb-5 pt-6 text-center shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/25 hover:shadow-card-hover"
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

      {/* Icon in the same gradient ring the city tiles use. */}
      <span className="relative rounded-full bg-gradient-to-br from-accent/70 via-accent/25 to-primary/35 p-[2.5px] transition-transform duration-300 group-hover:scale-105">
        <span className="grid h-[60px] w-[60px] place-items-center rounded-full bg-surface text-primary ring-2 ring-surface transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
      </span>

      <h3 className="mt-3.5 font-display text-base font-bold leading-tight text-ink transition-colors group-hover:text-primary">
        {name}
      </h3>

      {description && (
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink/50">{description}</p>
      )}

      <span className="mt-auto pt-3.5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/[0.06] px-2.5 py-1 text-[11px] font-semibold text-primary ring-1 ring-inset ring-primary/10 transition-colors group-hover:bg-primary/10">
          <Users className="h-3 w-3 text-accent" aria-hidden="true" />
          {formatCompactNumber(advocates)}+ lawyers
        </span>
      </span>
    </Link>
  );
}
