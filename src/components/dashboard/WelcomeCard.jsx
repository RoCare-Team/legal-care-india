import Link from 'next/link';
import { PartyPopper, ArrowRight, Clock } from 'lucide-react';

/**
 * The first thing a lawyer sees after their account is created.
 *
 * Registration is now four things — a number, a name, an email and a city — so
 * the account arrives almost empty and the lawyer arrives without being told
 * what is left. This says both: how much of the profile is filled in, and that
 * the listing is waiting on a review rather than on them.
 *
 * Shown once, on the redirect from signup. It is not a permanent banner: the
 * completion card below carries the same progress every day after this one.
 *
 * @param {object} props
 * @param {string} props.name
 * @param {string} props.status   'pending' until an admin approves the profile
 * @param {number} props.done     checklist items already filled in
 * @param {number} props.total
 */
export default function WelcomeCard({ name, status, done, total }) {
  const first = String(name || '').replace(/^Adv\.?\s*/i, '').split(' ')[0] || 'there';
  const left = Math.max(0, total - done);
  const percent = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.07] via-surface to-surface p-6 shadow-card">
      <div className="flex items-start gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <PartyPopper className="h-5 w-5" aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-semibold text-ink">
            Welcome, {first} — your account is ready.
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ink/65">
            Your number is verified and this dashboard is yours. Your profile is{' '}
            <span className="font-semibold text-ink">{percent}% complete</span>
            {left > 0 ? (
              <>
                {' '}— {left} {left === 1 ? 'thing' : 'things'} left. We will walk you
                through them one step at a time; at 100% your profile is as
                strong as it gets.
              </>
            ) : (
              '.'
            )}
          </p>

          {status === 'pending' && (
            <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-amber-900">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
              Every new profile is checked by our team before it appears in the
              directory. You can fill everything in now — it goes live with the
              approval.
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2.5">
            {/* Into the guided route, not the full editor. A lawyer who has
                just registered does not yet know what a complete profile
                contains, and a page of forty fields is where that gets
                abandoned. */}
            <Link
              href="/setup"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              Set up my profile
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/dashboard/plan"
              className="inline-flex items-center gap-2 rounded-xl border border-ink/12 bg-surface px-4 py-2.5 text-sm font-semibold text-ink/75 transition-colors hover:border-ink/25 hover:text-ink"
            >
              See the plans
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
