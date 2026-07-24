import Link from 'next/link';
import { ArrowRight, Users } from 'lucide-react';
import { Card } from '@/components/ui';
import { formatCompactNumber } from '@/utils/formatters';

/**
 * CategoryCard — a single legal-service entry in the categories grid.
 *
 * @param {object} props
 * @param {import('@/data/categories').CATEGORIES[number]} props.category
 */
export default function CategoryCard({ category }) {
  const { slug, name, icon: Icon, advocates, description } = category;

  return (
    <Card
      as={Link}
      href={`/legal-services/${slug}`}
      hoverable
      padding="none"
      className="group relative block h-full overflow-hidden bg-gradient-to-b from-surface to-primary/[0.02] transition-all duration-300 hover:-translate-y-1.5"
    >
      {/* Soft brand wash on hover */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.05] to-accent/[0.06] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      {/* Gold accent bar that grows on hover */}
      <span className="absolute left-0 top-0 h-full w-1 origin-top scale-y-0 bg-accent transition-transform duration-300 group-hover:scale-y-100" />

      <div className="relative flex h-full flex-col p-5">
        <div className="flex items-start justify-between">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary ring-1 ring-primary/10 transition-all duration-300 group-hover:from-primary group-hover:to-primary-dark group-hover:text-white group-hover:shadow-brand group-hover:ring-primary">
            <Icon className="h-7 w-7" aria-hidden="true" />
          </span>
          <span className="grid h-8 w-8 place-items-center rounded-full text-ink/25 transition-all duration-300 group-hover:bg-accent/15 group-hover:text-primary">
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </span>
        </div>

        <h3 className="mt-4 font-display text-lg font-semibold text-ink transition-colors group-hover:text-primary">{name}</h3>
        {description && (
          <p className="mt-1 text-sm leading-relaxed text-ink/55">{description}</p>
        )}

        <div className="mt-auto border-t border-ink/8 pt-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/[0.06] px-3 py-1 text-xs font-semibold text-primary ring-1 ring-inset ring-primary/10">
            <Users className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            {formatCompactNumber(advocates)}+ lawyers
          </span>
        </div>
      </div>
    </Card>
  );
}
