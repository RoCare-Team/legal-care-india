import { Section, Heading } from '@/components/ui';
import TestimonialCard from '@/components/cards/TestimonialCard';
import SectionReveal from '@/components/shared/SectionReveal';
import { TESTIMONIALS } from '@/data/testimonials';

/**
 * Testimonials — social proof from clients who used the platform.
 */
export default function Testimonials() {
  return (
    <Section className="bg-muted/50">
      <Heading
        centered
        eyebrow="Client Stories"
        subtitle="Real experiences from people who found the right advocate through our platform."
      >
        Trusted by Thousands
      </Heading>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {TESTIMONIALS.map((testimonial, i) => (
          <SectionReveal key={testimonial.id} delay={i * 0.1}>
            <TestimonialCard testimonial={testimonial} />
          </SectionReveal>
        ))}
      </div>
    </Section>
  );
}
