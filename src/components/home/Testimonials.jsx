import { MessageSquarePlus, Quote } from 'lucide-react';
import { Section, Heading } from '@/components/ui';
import TestimonialsCarousel from './TestimonialsCarousel';
import TestimonialForm from './TestimonialForm';
import { getTestimonials } from '@/lib/testimonials';

/**
 * Testimonials — real reviews of the platform submitted by visitors, shown as a
 * slider. Anyone can add their own via the "Share your experience" button.
 *
 * Wrapped in its own tinted band with a headline star-rating summary, so the
 * section reads as social proof at a glance rather than a plain list of cards.
 */
export default async function Testimonials() {
  const testimonials = await getTestimonials();
  const count = testimonials.length;

  return (
    <Section
      spacing="sm"
      className="relative overflow-hidden border-y border-ink/8 bg-muted/40"
    >
      {/* Soft brand glows in the band — gold from the top-right, navy from the
          bottom-left — plus one oversized watermark quote. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(680px 340px at 88% -10%, rgb(var(--color-accent) / 0.10), transparent 60%), radial-gradient(680px 380px at 6% 115%, rgb(var(--color-primary) / 0.08), transparent 60%)',
        }}
      />
      <Quote
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-8 h-40 w-40 -translate-x-1/2 rotate-180 fill-primary/[0.04] text-primary/[0.04]"
      />

      <div className="relative">
        <div className="flex flex-col items-center gap-3.5">
          <Heading centered eyebrow="Client Stories">
            What Our Clients Say
          </Heading>

          <TestimonialForm />
        </div>

        {count > 0 ? (
          <TestimonialsCarousel testimonials={testimonials} />
        ) : (
          <div className="mt-10 grid place-items-center rounded-2xl border border-dashed border-ink/15 bg-surface px-6 py-14 text-center">
            <MessageSquarePlus className="h-10 w-10 text-primary/60" aria-hidden="true" />
            <h3 className="mt-4 font-semibold text-ink">No reviews yet</h3>
            <p className="mt-1 max-w-sm text-sm text-ink/55">
              Be the first to share your experience using Legal Care India.
            </p>
          </div>
        )}
      </div>
    </Section>
  );
}
