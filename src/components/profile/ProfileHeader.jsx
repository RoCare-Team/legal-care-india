import { BadgeCheck, MapPin, Briefcase, Scale, Languages, Fingerprint, Gavel } from 'lucide-react';
import { Avatar, Badge } from '@/components/ui';
import Rating from '@/components/shared/Rating';
import { formatExperience } from '@/utils/formatters';
import PresenceIndicator from '@/components/consultation/PresenceIndicator';

/**
 * ProfileHeader — cover banner, avatar, identity and headline meta for a
 * lawyer's public profile.
 *
 * @param {object} props
 * @param {object} props.advocate  full profile from getAdvocateBySlug
 */
export default function ProfileHeader({ advocate }) {
  const {
    name, photo, coverImage, city, state, experience, rating, reviews, verified,
    barCouncilNumber, tagline, languages = [], metrics, legalCareId, online, _id,
    courts = [], practiceCities = [],
  } = advocate;

  // Cities the lawyer serves, minus the base city (shown separately).
  const otherCities = practiceCities.filter((c) => c && c !== city);

  return (
    <div className="overflow-hidden rounded-2xl border border-ink/8 bg-surface shadow-card" suppressHydrationWarning>
      <div
        className="relative h-36 bg-gradient-to-br from-primary via-primary-dark to-secondary sm:h-48"
        style={coverImage ? { backgroundImage: `url(${coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      >
        {!coverImage && (
          <>
            {/* Soft gold + navy glows for a premium banner */}
            <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-primary-light/25 blur-3xl" aria-hidden="true" />
            {/* Faint scale-of-justice watermark */}
            <Scale className="pointer-events-none absolute -right-4 top-2 h-40 w-40 rotate-12 text-white/[0.06]" aria-hidden="true" />
          </>
        )}
        <div className="pointer-events-none absolute inset-0 bg-black/10" aria-hidden="true" />
        {/* Gold hairline at the base of the cover */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" aria-hidden="true" />
      </div>

      <div className="px-5 pb-6 pt-5 sm:px-8 sm:pb-8 sm:pt-6">
        <div className="flex flex-row items-center gap-4 sm:items-end sm:gap-5">
          <Avatar
            src={photo}
            name={name}
            size="xl"
            ring
            className="h-24 w-24 shadow-card sm:-mt-12 sm:h-28 sm:w-28"
          />
          <div className="flex-1 sm:pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
                {name}
              </h1>
              {verified && (
                <Badge variant="primary" icon={<BadgeCheck className="h-3.5 w-3.5" />}>
                  Verified
                </Badge>
              )}
              <PresenceIndicator id={_id} initialAvailable={online} variant="profile" />
            </div>
            {tagline && <p className="mt-1 text-sm text-ink/60">{tagline}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <Rating value={rating} reviews={reviews} size="sm" />
              {legalCareId && (
                <span
                  title="Legal Care India ID"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary/5 px-2.5 py-1 font-mono text-xs font-semibold tracking-wide text-primary ring-1 ring-primary/10"
                >
                  <Fingerprint className="h-3.5 w-3.5" aria-hidden="true" />
                  {legalCareId}
                </span>
              )}
            </div>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-ink/8 pt-5 sm:grid-cols-4">
          <Meta icon={MapPin} label="Location" value={`${city}, ${state}`} />
          <Meta icon={Briefcase} label="Experience" value={formatExperience(experience).replace(' experience', '')} />
          <Meta icon={Scale} label="Bar Council No." value={barCouncilNumber} />
          <Meta icon={Languages} label="Languages" value={languages.join(', ')} />
        </dl>

        {(courts.length > 0 || otherCities.length > 0) && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {courts.length > 0 && (
              <ChipRow icon={Gavel} label="Practises in">
                {courts.map((c) => (
                  <span key={c} className="rounded-lg bg-primary/8 px-2.5 py-1 text-xs font-medium text-primary ring-1 ring-primary/10">
                    {c}
                  </span>
                ))}
              </ChipRow>
            )}
            {otherCities.length > 0 && (
              <ChipRow icon={MapPin} label="Also works in">
                {otherCities.map((c) => (
                  <span key={c} className="rounded-lg bg-accent/10 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-accent/25">
                    {c}
                  </span>
                ))}
              </ChipRow>
            )}
          </div>
        )}

        {metrics && (metrics.cases > 0 || metrics.clients > 0 || metrics.successRate > 0) && (
          <div className="mt-5 grid grid-cols-3 gap-3">
            {metrics.cases > 0 && <Stat value={`${metrics.cases}+`} label="Cases Handled" />}
            {metrics.clients > 0 && <Stat value={`${metrics.clients}+`} label="Clients Advised" />}
            {metrics.successRate > 0 && <Stat value={`${metrics.successRate}%`} label="Success Rate" />}
          </div>
        )}
      </div>
    </div>
  );
}

function ChipRow({ icon: Icon, label, children }) {
  return (
    <div className="rounded-xl border border-ink/8 bg-muted/40 p-3">
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink/45">
        <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Meta({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-ink/8 bg-muted/40 p-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <dt className="text-[11px] uppercase tracking-wide text-ink/40">{label}</dt>
        <dd className="text-sm font-semibold leading-snug text-ink/85">{value || '—'}</dd>
      </div>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-ink/8 bg-gradient-to-b from-muted/50 to-surface px-3 py-4 text-center shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-card">
      {/* Gold top accent */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-accent/70 to-transparent opacity-70" aria-hidden="true" />
      <p className="font-display text-2xl font-bold text-primary">{value}</p>
      <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-ink/50">{label}</p>
    </div>
  );
}
