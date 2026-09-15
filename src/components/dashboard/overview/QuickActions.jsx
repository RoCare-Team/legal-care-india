import Link from 'next/link';
import { MessageCircleMore, Phone, Video, Settings } from 'lucide-react';
import { advocateRates, formatRate } from '@/constants/callRates';

/**
 * The four tiles under the topbar: the three channels a client can book, each
 * with the rate the lawyer charges on it (or that it is switched off), and
 * settings. The channels open the rate editor.
 *
 * @param {object} props
 * @param {object} props.advocate  raw record — rates are read as stored
 */
export default function QuickActions({ advocate }) {
  const rates = advocateRates(advocate);
  const tiles = [
    { label: 'Chat', icon: MessageCircleMore, sub: formatRate(rates.chat) || 'Not offered', href: '/dashboard/profile#slots' },
    { label: 'Audio Call', icon: Phone, sub: formatRate(rates.audio) || 'Not offered', href: '/dashboard/profile#slots' },
    { label: 'Video Call', icon: Video, sub: formatRate(rates.video) || 'Not offered', href: '/dashboard/profile#slots' },
    { label: 'Settings', icon: Settings, sub: 'Account', href: '/dashboard/settings' },
  ];

  return (
    <div className="grid grid-cols-4 gap-2.5 sm:gap-4">
      {tiles.map(({ label, icon: Icon, sub, href }) => (
        <Link
          key={label}
          href={href}
          className="group flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-ink/8 bg-surface px-1 py-3.5 text-center shadow-card transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:bg-accent/[0.08] sm:py-5"
        >
          <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/[0.07] text-primary transition-colors group-hover:bg-accent/25 group-hover:text-primary-dark">
            <Icon className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
          </span>
          <span className="text-xs font-semibold text-ink sm:text-sm">{label}</span>
          <span className="hidden text-[11px] text-ink/45 sm:block">{sub}</span>
        </Link>
      ))}
    </div>
  );
}
