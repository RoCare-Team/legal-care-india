import { BadgeCheck, MapPin, Briefcase, Scale, Languages } from 'lucide-react';
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
    barCouncilNumber, tagline, languages = [], metrics,
  } = advocate;

  return (
    <div className="overflow-hidden rounded-2xl border border-ink/8 bg-surface shadow-card">
      <div
        className="relative h-36 bg-gradient-to-br from-primary via-primary-dark to-secondary sm:h-48"
        style={coverImage ? { backgroundImage: `url(${coverImage})`, backgroundSize: 'cover' } : undefined}
      >
        <div className="pointer-events-none absolute inset-0 bg-black/10" aria-hidden="true" />
      </div>

      <div className="px-6 pb-6 sm:px-8 sm:pb-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:gap-5">
          <Avatar
            src={photo}
            name={name}
            size="xl"
            ring
            className="-mt-12 shadow-card sm:-mt-16"
          />
          <div className="mt-4 flex-1 sm:mt-0 sm:pb-1">
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
            <div className="mt-2">
              <Rating value={rating} reviews={reviews} size="sm" />
            </div>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-ink/8 pt-5 sm:grid-cols-4">
          <Meta icon={MapPin} label="Location" value={`${city}, ${state}`} />
          <Meta icon={Briefcase} label="Experience" value={formatExperience(experience).replace(' experience', '')} />
          <Meta icon={Scale} label="Bar Council No." value={barCouncilNumber} />
          <Meta icon={Languages} label="Languages" value={languages.join(', ')} />
        </dl>

        {metrics && (
          <div className="mt-5 grid grid-cols-3 gap-3">
            <Stat value={`${metrics.cases}+`} label="Cases Handled" />
            <Stat value={`${metrics.clients}+`} label="Clients Advised" />
            <Stat value={`${metrics.successRate}%`} label="Success Rate" />
          </div>
        )}
      </div>
    </div>
  );
}

function Meta({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-xs text-ink/45">{label}</dt>
        <dd className="truncate text-sm font-medium text-ink/80">{value}</dd>
      </div>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="rounded-xl bg-muted/60 px-3 py-3 text-center">
      <p className="font-display text-lg font-semibold text-primary">{value}</p>
      <p className="mt-0.5 text-xs text-ink/55">{label}</p>
    </div>
  );
}
