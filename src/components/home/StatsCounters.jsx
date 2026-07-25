'use client';

import { Scale, MapPin, Users, Briefcase } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import { formatCompactNumber } from '@/utils/formatters';

const ICONS = { scale: Scale, map: MapPin, users: Users, briefcase: Briefcase };

/**
 * Anything in the thousands is compacted and always carries one decimal —
 * "1.0K", not "1K" — so the figure keeps a consistent shape as it climbs
 * through 1.1K, 1.2K and on. Smaller counts stay whole; "13.0" would be silly.
 */
function formatStat(value) {
  if (value < 1000) return formatCompactNumber(value);
  return new Intl.NumberFormat('en-IN', {
    notation: 'compact',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * StatItem — a single animated metric that counts up when scrolled into view,
 * on a glass tile so each number sits on its own surface rather than floating
 * loose over a photograph.
 */
function StatItem({ value, suffix, label, icon }) {
  const [count, ref] = useCountUp(value);
  const Icon = ICONS[icon] || Scale;

  return (
    <div
      ref={ref}
      className="group rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-4 text-center backdrop-blur-sm transition-colors duration-300 hover:border-accent/40 hover:bg-white/[0.09]"
    >
      <span className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-accent/15 text-accent ring-1 ring-inset ring-accent/25 transition-transform duration-300 group-hover:scale-105">
        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      </span>

      <p className="mt-2.5 font-display text-[28px] font-bold leading-none text-white sm:text-[32px]">
        {formatStat(count)}
        <span className="text-gold">{suffix}</span>
      </p>

      <span className="rule-gold mx-auto mt-2 block h-px w-8" aria-hidden="true" />

      <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60 sm:text-[11px]">
        {label}
      </p>
    </div>
  );
}

/**
 * StatsCounters — the animated tiles. Split from the band itself so the section
 * can stay a server component and count the real figures from the database.
 *
 * @param {object} props
 * @param {Array<{id:string,value:number,suffix:string,label:string,icon:string}>} props.stats
 */
export default function StatsCounters({ stats = [] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
      {stats.map((stat) => (
        <StatItem key={stat.id} {...stat} />
      ))}
    </div>
  );
}
