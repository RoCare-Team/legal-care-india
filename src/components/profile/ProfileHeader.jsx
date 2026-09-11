import Image from 'next/image';
import {
  BadgeCheck, MapPin, Briefcase, Scale, Languages, Fingerprint, Star, Sparkles,
  Check, Users, TrendingUp, FolderCheck,
} from 'lucide-react';
import { formatExperience } from '@/utils/formatters';
import PresenceIndicator from '@/components/consultation/PresenceIndicator';
import Container from '@/components/ui/Container';
import ProfileConsultPanel from './ProfileConsultPanel';

/** Practice areas named in the header before the rest become "+N more". */
const AREA_LIMIT = 4;

/**
 * ProfileHeader — who the lawyer is, the facts that stand behind that, and the
 * consult panel, on one band under the navbar.
 *
 * Two columns: identity and facts on the left, the price list and the way in on
 * the right, in a card of its own so it reads as the one thing on the page that
 * is pressed rather than read.
 *
 * The courts and the cities a lawyer serves used to sit here too, as two walls
 * of chips. A lawyer who serves twenty cities pushed their own facts and the
 * About text half a screen down, so both lists now live beside the body — see
 * ProfileCoverage.
 *
 * @param {object} props
 * @param {object} props.advocate  full profile from getAdvocateBySlug
 */
export default function ProfileHeader({ advocate }) {
  const {
    name, photo, city, state, experience, rating, reviews, verified,
    barCouncilNumber, tagline, languages = [], metrics = {}, legalCareId, _id,
    designation, specializations = [],
  } = advocate;

  const standing = [designation || 'Advocate', specializations[0]].filter(Boolean).join(' · ');
  const initial = String(name || '').replace(/^Adv\.?\s*/i, '').charAt(0).toUpperCase() || 'A';
  const hasReviews = Number(reviews) > 0 && Number(rating) > 0;

  // The facts, then the lawyer's own practice figures — only the ones they
  // actually entered. "0 clients, 0% success" is worse than saying nothing.
  const facts = [
    { icon: MapPin, label: 'Location', value: [city, state].filter(Boolean).join(', ') },
    { icon: Briefcase, label: 'Experience', value: formatExperience(experience).replace(' experience', '') },
    { icon: Scale, label: 'Bar Council No.', value: barCouncilNumber },
    { icon: Languages, label: 'Languages', value: languages.join(', ') },
    metrics.cases > 0 && { icon: FolderCheck, label: 'Cases Handled', value: `${metrics.cases}+` },
    metrics.clients > 0 && { icon: Users, label: 'Clients Advised', value: `${metrics.clients}+` },
    metrics.successRate > 0 && { icon: TrendingUp, label: 'Success Rate', value: `${metrics.successRate}%` },
  ].filter((f) => f && f.value);

  return (
    <div className="relative border-b border-ink/8 bg-surface" suppressHydrationWarning>
      {/* A wash of the hero's blue-grey behind the top of the band, so the
          header reads as the start of the page rather than a white slab under
          a white navbar. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[#EEF2F8] to-transparent"
        aria-hidden="true"
      />

      <Container className="relative py-6 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-8 xl:grid-cols-[minmax(0,1fr)_430px] xl:gap-10">
          <div className="min-w-0">
            <div className="flex items-start gap-4 sm:gap-6">
              {/* Portrait — a rounded square, not a disc, for the same reason
                  as the cards: a disc crops the gown away. */}
              <div className="relative shrink-0">
                {/* The frame takes the photo's own shape: a fixed height, and
                    the width the photo needs at that height. Lawyers upload
                    everything from head shots to campaign posters; a fixed
                    square either cut the edges off anything that wasn't square
                    (a poster lost its heading and its name) or, fitted inside
                    it, left empty strips down both sides. Only a very wide
                    photo is held to a maximum width and trimmed at its sides. */}
                {photo ? (
                  <div className="overflow-hidden rounded-2xl bg-primary/[0.06] shadow-[0_12px_28px_-14px_rgba(30,58,95,0.45)] ring-4 ring-white">
                    <Image
                      src={photo}
                      alt={name}
                      width={264}
                      height={264}
                      priority
                      className="block h-[112px] w-auto min-w-[64px] max-w-[150px] object-cover sm:h-[160px] sm:min-w-[88px] sm:max-w-[220px]"
                    />
                  </div>
                ) : (
                  <div className="grid h-[112px] w-[92px] place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary/[0.12] to-primary/[0.04] font-display text-4xl font-semibold text-primary/70 shadow-[0_12px_28px_-14px_rgba(30,58,95,0.45)] ring-4 ring-white sm:h-[160px] sm:w-[132px] sm:text-5xl">
                    {initial}
                  </div>
                )}
                {verified && (
                  <span
                    className="absolute -bottom-1.5 -right-1.5 grid h-7 w-7 place-items-center rounded-full bg-emerald-500 text-white shadow-sm ring-[3px] ring-white sm:h-8 sm:w-8"
                    title="Verified advocate"
                  >
                    <Check className="h-4 w-4" strokeWidth={3} aria-label="Verified" />
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1 sm:pt-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <h1 className="font-display text-[24px] font-semibold leading-tight text-ink sm:text-[32px]">
                    {name}
                  </h1>
                  <PresenceIndicator id={_id} variant="profile" />
                </div>

                <p className="mt-1 text-[13.5px] font-semibold text-primary/80 sm:text-[14.5px]">{standing}</p>

                {tagline && (
                  <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-ink/60 sm:text-[14.5px]">
                    {tagline}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {verified && (
                    <Pill className="bg-emerald-50 text-emerald-700 ring-emerald-200/80">
                      <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      Verified Advocate
                    </Pill>
                  )}
                  {/* No row of five grey stars and "0.0 (0)" for a lawyer
                      nobody has reviewed yet — that reads as a bad score. */}
                  {hasReviews ? (
                    <Pill className="bg-amber-50 text-amber-800 ring-amber-200/80">
                      <Star className="h-3.5 w-3.5 fill-accent text-accent" aria-hidden="true" />
                      {Number(rating).toFixed(1)}
                      <span className="font-medium text-amber-800/70">
                        · {reviews} {Number(reviews) === 1 ? 'review' : 'reviews'}
                      </span>
                    </Pill>
                  ) : (
                    <Pill className="bg-primary/[0.05] text-primary/80 ring-primary/10">
                      <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                      New on Justiceland
                    </Pill>
                  )}
                  {legalCareId && (
                    <Pill className="bg-white font-mono tracking-wide text-ink/60 ring-ink/10" title="Justiceland ID">
                      <Fingerprint className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                      {legalCareId}
                    </Pill>
                  )}
                </div>
              </div>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {facts.map((f) => (
                <Fact key={f.label} {...f} />
              ))}
            </dl>

            {/* The practice areas, as the last line of the identity column —
                what the lawyer does, seen before anyone scrolls to Legal
                Services, and the line that brings this column down level
                with the consult card beside it. */}
            {specializations.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="mr-1 text-[11px] font-bold uppercase tracking-wide text-ink/40">
                  Practice areas
                </span>
                {specializations.slice(0, AREA_LIMIT).map((s) => (
                  <a
                    key={s}
                    href="#legal-services"
                    className="rounded-full border border-ink/10 bg-white px-3 py-1 text-[12.5px] font-semibold text-ink/75 transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    {s}
                  </a>
                ))}
                {specializations.length > AREA_LIMIT && (
                  <a
                    href="#legal-services"
                    className="rounded-full bg-primary/[0.06] px-3 py-1 text-[12.5px] font-semibold text-primary hover:bg-primary/10"
                  >
                    +{specializations.length - AREA_LIMIT} more
                  </a>
                )}
              </div>
            )}
          </div>

          <ProfileConsultPanel advocate={advocate} />
        </div>
      </Container>
    </div>
  );
}

function Pill({ className = '', title, children }) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ring-1 ${className}`}
    >
      {children}
    </span>
  );
}

function Fact({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-ink/[0.07] bg-white/80 px-3 py-2.5 shadow-[0_1px_2px_rgba(30,58,95,0.04)]">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/[0.07] text-primary">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <dt className="text-[10.5px] font-semibold uppercase tracking-wide text-ink/40">{label}</dt>
        <dd className="break-words text-[13.5px] font-semibold leading-snug text-ink/85">{value}</dd>
      </div>
    </div>
  );
}
