import { Search, UserCheck, CalendarCheck } from 'lucide-react';
import { Section, Heading } from '@/components/ui';
import SectionReveal from '@/components/shared/SectionReveal';

const STEPS = [
  {
    icon: Search,
    title: 'Describe Your Matter',
    description:
      'Family, property, criminal, workplace — pick your area of law and your city, and see only the advocates who handle it.',
  },
  {
    icon: UserCheck,
    title: 'Check the Credentials',
    description:
      'Bar Council number, years at the bar, courts they appear in, languages and fees — verified and side by side.',
  },
  {
    icon: CalendarCheck,
    title: 'Consult in Confidence',
    description:
      'Chat, call or start a video consultation. Your identity stays private until you decide to share it.',
  },
];

/**
 * HowItWorks — three-step explanation of the platform flow.
 */
export default function HowItWorks() {
  return (
    <Section id="how-it-works" className="pb-8 sm:pb-10">
      <Heading
        centered
        eyebrow="How It Works"
        subtitle="No middlemen, no referral fees — you choose the advocate and speak to them directly."
      >
        From Your Problem to a Lawyer, in Three Steps
      </Heading>

      <div className="relative mt-10 grid gap-6 md:grid-cols-3">
        {/* Hairline running behind the three cards, so they read as one journey
            rather than three unrelated boxes. Desktop only — stacked on mobile
            the line would point nowhere. */}
        <span
          className="rule-gold pointer-events-none absolute inset-x-[16%] top-7 hidden h-px md:block"
          aria-hidden="true"
        />

        {STEPS.map(({ icon: Icon, title, description }, i) => (
          <SectionReveal key={title} delay={i * 0.1}>
            <div className="edge-gold relative h-full overflow-hidden rounded-2xl border border-ink/8 bg-surface px-6 pb-7 pt-8 text-center shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
              {/* Big ghosted numeral — gives the sequence weight without adding
                  another badge to read. */}
              <span
                className="pointer-events-none absolute -right-1 -top-3 select-none font-display text-[5.5rem] font-bold leading-none text-primary/[0.06]"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <span className="relative mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-brand ring-4 ring-surface">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="relative mt-5 font-display text-lg font-semibold text-ink">{title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-ink/60">{description}</p>
            </div>
          </SectionReveal>
        ))}
      </div>
    </Section>
  );
}
