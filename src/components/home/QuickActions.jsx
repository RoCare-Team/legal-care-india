import Link from 'next/link';
import { MessageCircle, Phone, Video, HandHeart } from 'lucide-react';
import { Section } from '@/components/ui';

/**
 * QuickActions — four quick entry cards above Featured Advocates. Every card
 * takes the visitor to the advocate directory to start.
 */
const ACTIONS = [
  {
    label: 'Chat with Advocate',
    desc: 'Start a live chat',
    icon: MessageCircle,
    tone: 'text-primary',
    chip: 'bg-primary/10',
    href: '/advocates',
  },
  {
    label: 'Call Advocate',
    desc: 'Talk over a call',
    icon: Phone,
    tone: 'text-emerald-600',
    chip: 'bg-emerald-500/10',
    href: '/advocates',
  },
  {
    label: 'Video Call',
    desc: 'Face-to-face consult',
    icon: Video,
    tone: 'text-amber-600',
    chip: 'bg-amber-500/10',
    href: '/advocates',
  },
  {
    label: 'Free Advice',
    desc: 'Get quick help',
    icon: HandHeart,
    tone: 'text-rose-600',
    chip: 'bg-rose-500/10',
    href: '/advocates',
  },
];

export default function QuickActions() {
  return (
    <Section spacing="sm" className="pb-0 sm:pb-0 mt-5">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {ACTIONS.map(({ label, desc, icon: Icon, tone, chip, href }) => (
          <Link
            key={label}
            href={href}
            className="group flex flex-col items-start gap-2.5 rounded-2xl border border-ink/8 bg-surface p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-card-hover sm:gap-3 sm:p-5"
          >
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${chip} ${tone}`}>
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block font-display text-[15px] font-semibold leading-snug text-ink sm:text-base">
                {label}
              </span>
              <span className="mt-1 block text-[13px] text-ink/55 sm:text-xs">{desc}</span>
            </span>
          </Link>
        ))}
      </div>
    </Section>
  );
}
