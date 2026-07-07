import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
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
    <Card as={Link} href={`/legal-services/${slug}`} hoverable className="group block">
      <div className="flex items-start justify-between">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
        <ArrowRight className="h-5 w-5 text-ink/30 transition-all group-hover:translate-x-1 group-hover:text-primary" />
      </div>

      <h3 className="mt-4 font-semibold text-ink">{name}</h3>
      {description && <p className="mt-1 text-sm text-ink/60">{description}</p>}

      <p className="mt-3 text-sm font-medium text-primary">
        {formatCompactNumber(advocates)}+ advocates
      </p>
    </Card>
  );
}
