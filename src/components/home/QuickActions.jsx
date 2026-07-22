import Link from 'next/link';
import { MessageCircle, Phone, Video, Scale, ArrowUpRight } from 'lucide-react';
import { Section } from '@/components/ui';

/**
 * QuickActions — the four ways to reach a lawyer, sitting directly under the
 * hero. Every card lands on the directory, where the visitor picks who to talk
 * to.
 *
 * All four share the navy-and-gold palette rather than one colour each: a row
 * of green/amber/rose chips read as four unrelated apps, not one law practice.
 */
const ACTIONS = [
  {
    label: 'Chat with a Lawyer',
    desc: 'Private message consultation',
    icon: MessageCircle,
    href: '/lawyers',
  },
  {
    label: 'Talk on Call',
    desc: 'Speak to an advocate directly',
    icon: Phone,
    href: '/lawyers',
  },
  {
    label: 'Video Consultation',
    desc: 'Face to face, from anywhere',
    icon: Video,
    href: '/lawyers',
  },
  {
    label: 'Ask a Legal Question',
    desc: 'Get a first opinion on your matter',
    icon: Scale,
    href: '/lawyers',
  },
];

export default function QuickActions() {
  return (
    <Section spacing="sm" className="pb-0 sm:pb-0 mt-5">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {ACTIONS.map(({ label, desc, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="edge-gold group relative flex flex-col items-start gap-2.5 overflow-hidden rounded-2xl border border-ink/8 bg-surface p-4 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-card-hover sm:gap-3 sm:p-5"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-brand transition-transform duration-300 group-hover:scale-105">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block font-display text-[15px] font-semibold leading-snug text-ink transition-colors group-hover:text-primary sm:text-base">
                {label}
              </span>
              <span className="mt-1 block text-[13px] leading-snug text-ink/55 sm:text-xs">{desc}</span>
            </span>
            {/* Gold arrow that slides in on hover — the affordance that says
                "this goes somewhere", without adding a button per card. */}
            <ArrowUpRight
              className="absolute right-3.5 top-3.5 h-4 w-4 -translate-y-1 translate-x-1 text-accent opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100"
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>
    </Section>
  );
}
