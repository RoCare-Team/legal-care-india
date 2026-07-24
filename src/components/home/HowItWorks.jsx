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
      <Heading centered eyebrow="How It Works">
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
            <div className="group edge-gold relative flex h-full flex-col items-center overflow-hidden rounded-2xl border border-ink/8 bg-gradient-to-b from-surface to-primary/[0.025] px-6 pb-7 pt-9 text-center shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/20 hover:shadow-card-hover">
              {/* Big ghosted numeral — gives the sequence weight without adding
                  another badge to read. */}
              <span
                className="pointer-events-none absolute -right-2 -top-4 select-none font-display text-[6rem] font-bold leading-none text-primary/[0.05] transition-colors duration-300 group-hover:text-accent/[0.12]"
                aria-hidden="true"
              >
                {i + 1}
              </span>

              {/* Icon tile: soft navy at rest, fills to a navy gradient on hover;
                  a gold step badge sits on its corner. */}
              <span className="relative">
                <span className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/[0.08] text-primary ring-1 ring-primary/10 transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-primary group-hover:to-primary-dark group-hover:text-white group-hover:shadow-brand">
                  <Icon className="h-7 w-7" aria-hidden="true" />
                </span>
                <span className="absolute -bottom-1.5 -right-1.5 grid h-6 w-6 place-items-center rounded-full bg-accent text-[11px] font-bold text-primary-dark shadow-sm ring-2 ring-surface">
                  {i + 1}
                </span>
              </span>

              <p className="relative mt-5 text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
                Step {String(i + 1).padStart(2, '0')}
              </p>
              <h3 className="relative mt-1.5 font-display text-lg font-semibold text-ink">{title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-ink/60">{description}</p>
            </div>
          </SectionReveal>
        ))}
      </div>
    </Section>
  );
}
