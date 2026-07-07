import { Search, UserCheck, CalendarCheck } from 'lucide-react';
import { Section, Heading } from '@/components/ui';
import SectionReveal from '@/components/shared/SectionReveal';

const STEPS = [
  {
    icon: Search,
    title: 'Search & Filter',
    description:
      'Search by legal service, city, language or experience to shortlist advocates that fit your needs.',
  },
  {
    icon: UserCheck,
    title: 'Compare Verified Profiles',
    description:
      'Review verified credentials, ratings, client reviews and consultation fees side by side.',
  },
  {
    icon: CalendarCheck,
    title: 'Connect Directly',
    description:
      'Reach out to the advocate directly to discuss your matter and book a consultation.',
  },
];

/**
 * HowItWorks — three-step explanation of the platform flow.
 */
export default function HowItWorks() {
  return (
    <Section id="how-it-works">
      <Heading
        centered
        eyebrow="How It Works"
        subtitle="Finding the right advocate is simple, transparent and free."
      >
        Get Legal Help in 3 Easy Steps
      </Heading>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, description }, i) => (
          <SectionReveal key={title} delay={i * 0.1}>
            <div className="relative h-full rounded-2xl border border-ink/8 bg-surface p-6 text-center shadow-card">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-white">
                Step {i + 1}
              </span>
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-7 w-7" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-sm text-ink/60">{description}</p>
            </div>
          </SectionReveal>
        ))}
      </div>
    </Section>
  );
}
