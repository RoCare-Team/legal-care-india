import { BadgeCheck, MapPin, Briefcase, Scale, Languages, Fingerprint } from 'lucide-react';
import { Avatar, Badge } from '@/components/ui';
import Rating from '@/components/shared/Rating';
import { formatExperience } from '@/utils/formatters';

/**
 * ProfileHeader — cover banner, avatar, identity and headline meta for an
 * advocate's public profile.
 *
 * @param {object} props
 * @param {object} props.advocate  full profile from getAdvocateBySlug
 */
export default function ProfileHeader({ advocate }) {
  const {
    name, photo, coverImage, city, state, experience, rating, reviews, verified,
    barCouncilNumber, tagline, languages = [], metrics, legalCareId,
  } = advocate;

  return (
    <div className="overflow-hidden rounded-2xl border border-ink/8 bg-surface shadow-card">
      <div
        className="relative h-36 bg-gradient-to-br from-primary via-primary-dark to-secondary sm:h-48"
        style={coverImage ? { backgroundImage: `url(${coverImage})`, backgroundSize: 'cover' } : undefined}
      >
        <div className="pointer-events-none absolute inset-0 bg-black/10" aria-hidden="true" />
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
    <div className="rounded-xl border border-ink/8 bg-gradient-to-b from-muted/50 to-surface px-3 py-4 text-center shadow-sm">
      <p className="font-display text-2xl font-bold text-primary">{value}</p>
      <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-ink/50">{label}</p>
    </div>
  );
}
