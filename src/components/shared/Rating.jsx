import { Star } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatRating } from '@/utils/formatters';

/**
 * Rating — star rating with optional numeric value and review count.
 *
 * @param {object} props
 * @param {number} props.value              rating from 0-5
 * @param {number} [props.reviews]          number of reviews to show
 * @param {boolean} [props.showValue=true]
 * @param {string} [props.size='md']        'sm'|'md'
 * @param {string} [props.className]
 */
const STAR_SIZE = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4' };

export default function Rating({
  value = 0,
  reviews,
  showValue = true,
  size = 'md',
  className,
}) {
  const rounded = Math.round(value);

  return (
    <div
      className={cn('inline-flex items-center gap-1.5', className)}
      aria-label={`Rated ${formatRating(value)} out of 5`}
    >
      <span className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              STAR_SIZE[size],
              i < rounded ? 'fill-accent text-accent' : 'fill-ink/10 text-ink/10'
            )}
            aria-hidden="true"
          />
        ))}
      </span>
      {showValue && (
        <span className="text-sm font-semibold text-ink">{formatRating(value)}</span>
      )}
      {typeof reviews === 'number' && (
        <span className="text-sm text-ink/50">({reviews})</span>
      )}
    </div>
  );
}
