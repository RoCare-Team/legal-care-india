import { MessageSquarePlus } from 'lucide-react';
import { Section, Heading } from '@/components/ui';
import TestimonialsCarousel from './TestimonialsCarousel';
import TestimonialForm from './TestimonialForm';
import { getTestimonials } from '@/lib/testimonials';

/**
 * Testimonials — real reviews of the platform submitted by visitors, shown as a
 * slider. Anyone can add their own via the "Share your experience" button.
 */
export default async function Testimonials() {
  const testimonials = await getTestimonials();

  return (
    <Section className="bg-surface/55 pt-8 sm:pt-10">
      <div className="flex flex-col items-center gap-5">
        <Heading
          centered
          eyebrow="Client Stories"
          subtitle="People who found their advocate here, in their own words. Add yours once your matter is resolved."
        >
          What Our Clients Say
        </Heading>
        <TestimonialForm />
      </div>

      {testimonials.length > 0 ? (
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
    </Section>
  );
}
