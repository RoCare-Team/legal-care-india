import { BadgeCheck, ExternalLink, Scale, Clock } from 'lucide-react';
import PortalAvatar from './portal/PortalAvatar';
import AvailabilityToggle from './AvailabilityToggle';
import { lawyerProfileHref } from '@/utils/advocateUrl';
import { istGreeting } from '@/lib/dashboardOverview';

/**
 * DashboardTopbar — the navy identity banner at the top of the portal overview:
 * a greeting, the lawyer's name, and their online switch — the one control
 * they touch every day, so it is the largest thing here.
 *
 * @param {object} props
 * @param {object} props.advocate  the signed-in lawyer's profile
 */
export default function DashboardTopbar({ advocate }) {
  if (!advocate) return null;

  const bare = String(advocate.name || '').replace(/^Adv\.?\s*/i, '');
  const pending = advocate.status === 'pending';

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-dark to-secondary text-white shadow-brand">
      {/* Decoration only: a faint scale of justice and a gold glow. */}
      <Scale
        className="pointer-events-none absolute -right-6 -top-6 h-48 w-48 text-white/[0.04] sm:h-60 sm:w-60"
        strokeWidth={1}
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full bg-accent/15 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative flex flex-col gap-5 p-5 sm:p-7 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <span className="hidden sm:block">
            <PortalAvatar
              src={advocate.photo}
              name={advocate.name}
              size={80}
              className="rounded-2xl border-2 border-white/25 bg-white/10 text-white"
            />
          </span>
          <div className="min-w-0">
            <p className="text-sm text-white/70">{istGreeting()},</p>
            <h1 className="mt-0.5 flex flex-wrap items-center gap-2 font-display text-2xl font-semibold leading-tight sm:text-3xl">
              <span className="break-words">Adv. {bare}</span>
              {advocate.verified && (
                <BadgeCheck className="h-6 w-6 shrink-0 fill-emerald-500 text-white" aria-label="Verified" />
              )}
            </h1>
            {pending ? (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-accent">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                Profile under review — it goes live once approved
              </p>
            ) : (
              <p className="mt-1 text-sm text-white/70">Ready to help. Make a difference today!</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <AvailabilityToggle initialAvailable={advocate.available} variant="hero" />
          <a
            href={lawyerProfileHref(advocate)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-white/20 px-4 text-sm font-semibold text-white/85 transition-colors hover:border-white/40 hover:bg-white/5 hover:text-white"
          >
            {pending ? 'Preview Profile' : 'Public Profile'}
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
}
