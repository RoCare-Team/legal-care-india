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
      className="group flex items-center justify-center gap-3 px-2 py-1 sm:gap-4"
    >
      <span className="shrink-0 text-accent transition-transform duration-300 group-hover:scale-105">
        <Icon className="h-8 w-8 sm:h-10 sm:w-10" strokeWidth={1.5} aria-hidden="true" />
      </span>

      <div className="min-w-0 text-left">
      <p className="font-display text-[26px] font-bold leading-none text-white sm:text-[30px]">
        {formatStat(count)}
        <span className="text-gold">{suffix}</span>
      </p>


      <p className="mt-1 text-[12px] font-medium text-white/65 sm:text-[13px]">
        {label}
      </p>
      </div>
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
    <div className="grid grid-cols-2 gap-y-6 divide-white/10 sm:grid-cols-4 sm:gap-y-0 sm:divide-x">
      {stats.map((stat) => (
        <StatItem key={stat.id} {...stat} />
      ))}
    </div>
  );
}
