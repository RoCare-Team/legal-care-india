import { Clock } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * ProfileContactCard — the sticky sidebar beside the profile body.
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
    <aside id="contact" className="scroll-mt-24 lg:sticky lg:top-24">
      <div className="rounded-2xl border border-ink/8 bg-surface p-5 shadow-card">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
          Office Timing
        </h3>
        <ul className="mt-3 space-y-2 text-sm">
          {timing.map((t) => (
            <li key={t.day} className="flex items-center justify-between gap-3">
              <span className="text-ink/60">{t.day}</span>
              <span className={cn(`font-medium`, t.open ? `text-ink/80` : `text-ink/45`)}>
                {t.hours}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
