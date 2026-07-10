import { Quote } from 'lucide-react';
import { Card, Avatar } from '@/components/ui';
import Rating from '@/components/shared/Rating';

/**
 * TestimonialCard — a single client review of the platform.
 *
 * @param {object} props
 * @param {object} props.testimonial  { name, role, city, rating, text, date }
 */
export default function TestimonialCard({ testimonial }) {
  const { name, role, city, rating, text, date } = testimonial;
  const meta = [role, city].filter(Boolean).join(' · ');

  return (
    <Card className="flex h-full flex-col">
      <Quote className="h-8 w-8 text-primary/20" aria-hidden="true" />
      <p className="mt-3 flex-1 text-ink/80">{text}</p>
      <Rating value={rating} showValue={false} size="sm" className="mt-4" />

      <div className="mt-4 flex items-center gap-3 border-t border-ink/8 pt-4">
        <Avatar name={name} size="sm" />
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{name}</p>
          {meta && <p className="truncate text-sm text-ink/55">{meta}</p>}
          {date && <p className="mt-0.5 text-xs text-ink/40">{date}</p>}
        </div>
      </div>
    </Card>
  );
}
