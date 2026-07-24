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
    <Card
      hoverable
      padding="none"
      className="flex h-full flex-col bg-gradient-to-b from-surface to-primary/[0.02]"
    >
      {/* Oversized gold quote mark, bleeding off the corner as a watermark. */}
      <Quote
        className="pointer-events-none absolute -right-3 -top-4 h-24 w-24 rotate-180 fill-accent/[0.07] text-accent/[0.07]"
        aria-hidden="true"
      />

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <Rating value={rating} showValue={false} size="md" />

        <p className="relative mt-4 flex-1 text-[15px] leading-relaxed text-ink/80">
          {text}
        </p>

        <div className="mt-6 flex items-center gap-3 border-t border-ink/8 pt-5">
          <Avatar name={name} size="sm" className="ring-2 ring-accent/30 ring-offset-2 ring-offset-surface" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{name}</p>
            {meta && (
              <p className="truncate text-sm capitalize text-primary/80">{meta}</p>
            )}
            {date && <p className="mt-0.5 text-xs text-ink/40">{date}</p>}
          </div>
        </div>
      </div>
    </Card>
  );
}
