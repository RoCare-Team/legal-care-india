import { RotateCcw, Clock } from 'lucide-react';
import { Avatar } from '@/components/ui';

/** "8 min 30 sec" / "8 min" / "45 sec" from a whole-second count. */
function formatLeftover(sec = 0) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m && s) return `${m} min ${s} sec`;
  if (m) return `${m} min`;
  return `${s} sec`;
}

/** Rough "expires in Xh Ym" from an ISO timestamp (rendered at page load). */
function expiresIn(iso) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'expiring now';
  const hours = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (hours) return `expires in ${hours}h ${mins}m`;
  return `expires in ${mins}m`;
}

/**
 * PendingResumeCard — clients who have unused, paid time left with this lawyer
 * that they can reconnect for free within 24 hours. Lets the lawyer know a
 * "free" request from them isn't a mistake, and who might come back.
 *
 * @param {object} props
 * @param {Array} props.items  resumable consultation rows (leftover > 0)
 */
export default function PendingResumeCard({ items = [] }) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-accent/30 bg-accent/[0.05] p-6 shadow-card">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/20 text-primary-dark">
          <RotateCcw className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Leftover time to resume</h2>
          <p className="mt-0.5 text-sm text-ink/55">
            These clients ended early and can reconnect the rest, free, for 24 hours. No charge to
            you — it was already paid.
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-2.5">
        {items.map((c) => (
          <li key={c.id} className="flex items-center gap-3 rounded-xl border border-ink/8 bg-surface p-3.5">
            <Avatar name={c.userName} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-ink">{c.userName}</p>
              <p className="mt-0.5 text-xs text-ink/45">{expiresIn(c.resumeExpiresAt)}</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary/[0.06] px-3 py-1 text-xs font-semibold text-primary ring-1 ring-inset ring-primary/10">
              <Clock className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              {formatLeftover(c.resumeLeftoverSeconds)} left
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
