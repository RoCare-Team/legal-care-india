import Link from 'next/link';
import { Inbox, MapPin, Clock, ArrowRight, Scale, Lock, Coins } from 'lucide-react';

/**
 * Questions from the public "Ask a Lawyer" form, waiting for any lawyer to
 * take them. Shown on the overview because a query nobody opens the Queries
 * page for is a client nobody calls.
 *
 * @param {object} props
 * @param {number} props.count      how many are open in total
 * @param {Array} props.queries     the newest few (contact details masked)
 * @param {boolean} [props.locked]  no plan with query credits — show the count only
 * @param {object} [props.credits]  this month's credits, from lib/queryCredits
 */
export default function OpenQueriesCard({ count = 0, queries = [], locked = false, credits = null }) {
  return (
    <section className="rounded-2xl border border-ink/8 bg-surface p-5 shadow-card sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 font-display text-lg font-semibold text-ink">
          <Inbox className="h-5 w-5 text-primary" aria-hidden="true" />
          Client Queries
          {count > 0 && (
            <span className="grid h-6 min-w-6 place-items-center rounded-full bg-accent px-1.5 text-xs font-bold text-primary-dark">
              {count}
            </span>
          )}
        </h2>
        <Link href="/dashboard/queries" className="text-sm font-medium text-primary hover:underline">
          See All
        </Link>
      </div>

      {credits?.hasPlan && (
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-primary-dark">
          <Coins className="h-3.5 w-3.5" aria-hidden="true" />
          {credits.left} of {credits.allowance} credits left this month
        </p>
      )}

      {locked ? (
        <div className="mt-4 flex flex-col items-start gap-3 rounded-xl bg-primary/[0.05] p-4 sm:flex-row sm:items-center">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <Lock className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="flex-1 text-sm text-ink/70">
            {count > 0 ? <strong className="text-ink">{count} {count === 1 ? 'client is' : 'clients are'} waiting for a lawyer. </strong> : null}
            Client queries come with Professional (10 credits a month) and Premium (25 a month).
          </p>
          <Link
            href="/dashboard/queries"
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            Unlock <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      ) : queries.length === 0 ? (
        <p className="mt-4 rounded-xl bg-muted/60 px-4 py-4 text-sm text-ink/55">
          No open queries right now. Questions posted from the website appear here for every lawyer to take.
        </p>
      ) : (
        <>
          <ul className="mt-4 space-y-3">
            {queries.map((q) => (
              <li key={q.id} className="rounded-xl border border-ink/8 p-3.5">
                <p className="line-clamp-2 text-sm leading-relaxed text-ink/80">{q.message}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/50">
                  {q.category && (
                    <span className="inline-flex items-center gap-1 font-medium text-primary">
                      <Scale className="h-3 w-3" aria-hidden="true" />
                      {q.category}
                    </span>
                  )}
                  {q.city && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                      {q.city}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {q.age}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <Link
            href="/dashboard/queries"
            className="mt-4 flex h-11 items-center justify-center gap-2 rounded-xl bg-primary/[0.07] text-sm font-semibold text-primary transition-colors hover:bg-primary/[0.12]"
          >
            Take a query
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </>
      )}
    </section>
  );
}
