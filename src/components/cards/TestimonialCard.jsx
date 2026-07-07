import { Quote } from 'lucide-react';
import { Card } from '@/components/ui';
import Rating from '@/components/shared/Rating';

/**
 * TestimonialCard — a single client testimonial.
 *
 * @param {object} props
 * @param {import('@/data/testimonials').TESTIMONIALS[number]} props.testimonial
 */
export default function TestimonialCard({ testimonial }) {
  const { name, role, city, rating, quote } = testimonial;

  return (
    <Card className="flex h-full flex-col">
      <Quote className="h-8 w-8 text-primary/20" aria-hidden="true" />
      <p className="mt-3 flex-1 text-ink/80">{quote}</p>
      <Rating value={rating} showValue={false} size="sm" className="mt-4" />
      <div className="mt-4 border-t border-ink/8 pt-4">
        <p className="font-semibold text-ink">{name}</p>
        <p className="text-sm text-ink/55">
          {role} · {city}
        </p>
      </div>
    </Card>
  );
}
