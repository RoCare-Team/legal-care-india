import { Clock } from 'lucide-react';
import { cn } from '@/utils/cn';
import { SideCard } from './ProfileCoverage';

/**
 * ProfileContactCard — office hours, in the sidebar beside the profile body.
 *
 * The rates and the consult actions used to live here. They are in the header
 * now, beside the name, where the question they answer is the one a visitor
 * arrives with — down here they sat below the fold on a laptop, so the first
 * thing anyone saw of a paid service was the About text.
 *
 * What is left is the practical detail you want *after* deciding: when the
 * office is open. The card renders nothing when a lawyer has not filled that
 * in, rather than pinning an empty panel beside the page.
 *
 * @param {object} props
 * @param {object} props.advocate  full profile
 */
export default function ProfileContactCard({ advocate }) {
  // Only keep rows that actually have a day and hours filled in.
  const timing = (advocate.timing || []).filter((t) => t && t.day && t.hours);
  if (timing.length === 0) return null;

  return (
    <SideCard icon={Clock} title="Office Timing">
      <ul className="divide-y divide-ink/[0.06] text-[13.5px]">
        {timing.map((t) => (
          <li key={t.day} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
            <span className="text-ink/60">{t.day}</span>
            <span className={cn('font-semibold', t.open === false ? 'text-ink/40' : 'text-ink/85')}>
              {t.hours}
            </span>
          </li>
        ))}
      </ul>
    </SideCard>
  );
}
