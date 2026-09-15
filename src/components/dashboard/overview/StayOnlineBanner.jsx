'use client';

import Link from 'next/link';
import { Scale, ChevronRight, Loader2 } from 'lucide-react';
import { useAvailability } from '@/hooks/useAvailability';

/**
 * The closing band of the overview: a reminder of why the switch matters, and
 * the switch itself when they are offline.
 *
 * @param {object} props
 * @param {boolean} props.initialAvailable
 * @param {string} props.profileHref  their public profile
 */
export default function StayOnlineBanner({ initialAvailable, profileHref }) {
  const { available, saving, setAvailable } = useAvailability(initialAvailable);

  const cta =
    'inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-gradient-to-b from-[#E7C766] via-accent to-[#BC9A2E] px-6 text-sm font-semibold text-[#241B02] shadow-gold transition-transform hover:-translate-y-0.5 disabled:opacity-70';

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-dark via-primary to-primary-dark text-white shadow-brand">
      <span className="pointer-events-none absolute -right-10 -bottom-16 h-56 w-56 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />
      <div className="relative flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center sm:p-7">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-accent/15 text-accent ring-1 ring-accent/30">
          <Scale className="h-9 w-9" strokeWidth={1.6} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-2xl font-semibold leading-tight">Help People. Uphold Justice.</p>
          <p className="mt-1 text-sm text-white/70">
            Your expertise can change lives.{' '}
            {available ? 'Stay online to keep receiving clients.' : 'Go online and let clients reach you.'}
          </p>
        </div>
        {available ? (
          <Link href={profileHref} target="_blank" rel="noopener noreferrer" className={cta}>
            View your profile
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : (
          <button type="button" onClick={() => setAvailable(true)} disabled={saving} className={cta}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Go Online
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
