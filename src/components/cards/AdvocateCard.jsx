import Link from 'next/link';
import { MapPin, BadgeCheck, Star, Briefcase, Languages, ArrowRight } from 'lucide-react';
import { Avatar } from '@/components/ui';
import { formatExperience } from '@/utils/formatters';
import { formatDistance } from '@/utils/distance';
import { advocateProfilePath } from '@/utils/advocateUrl';
import { advocatePlans } from '@/constants/consultationPlans';
import CardContactActions from './CardContactActions';
import PresenceIndicator from '@/components/consultation/PresenceIndicator';

/**
 * The consultation rate. Rendered twice at different breakpoints — beside the
 * name on a wide card, down with the status badges on a narrow one — so it is
 * a component rather than two drifting copies of the same markup.
 */
function FeePill({ plan, fee, className = '' }) {
  return (
    <div
      className={`shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-center sm:rounded-2xl sm:px-4 sm:py-2 ${className}`}
    >
      <p className="text-base font-bold leading-tight text-slate-900 sm:text-lg">
        ₹{plan ? plan.price : fee}
      </p>
      <p className="mt-0.5 text-[11px] font-medium text-slate-500 sm:text-xs">
        {plan ? `${plan.minutes} min` : 'per consult'}
      </p>
    </div>
  );
}

/**
 * AdvocateCard — the directory listing card for a single lawyer.
 *
 * Built to read as a product card rather than a directory row: a 120px portrait
 * on the left, the identity and facts beside it, the rate as a quiet pill in
 * the corner, and the three ways to make contact along the foot. Only one thing
 * is filled in the accent colour at a time, so the eye always knows where the
 * next step is.
 *
 * Everything is on an 8px rhythm — 24px padding, 24px between the portrait and
 * the text, 8px inside groups.
 *
 * On a phone that layout collapses: the card is barely 280px of usable width,
 * and a 120px portrait plus a rate pill in the corner left the name about 40px
 * to live in — "Manoj Sharma" came out as "m.". So below `sm` the portrait
 * shrinks to 88px and the rate drops out of the corner into the badge row,
 * which hands the whole remaining width back to the name.
 *
 * Presentational: receives a single `advocate` record.
 *
 * @param {object} props
 * @param {object} props.advocate
 */
export default function AdvocateCard({ advocate }) {
  const {
    name,
    photo,
    city,
    state,
    experience,
    rating,
    reviews,
    verified,
    specializations = [],
    languages = [],
    consultationFee,
    consultationPlans = [],
    videoPlans = [],
    audioPlans = [],
    contact,
    _distance,
  } = advocate;

  // Present only during a "near me" search — how far this office is from the user.
  const distanceLabel = typeof _distance === 'number' ? formatDistance(_distance) : '';

  // Headline rate = the lawyer's cheapest live-chat plan. Lawyers who haven't
  // set any plan fall back to their flat consultation fee.
  const cheapestPlan = consultationPlans.length
    ? consultationPlans.reduce((lo, p) => (p.price < lo.price ? p : lo))
    : null;

  const profileHref = `/lawyers/${advocateProfilePath(advocate)}`;
  const practiceArea = specializations.slice(0, 2).join(' · ');

  return (
    <article className="group flex h-full flex-col rounded-3xl border-2 border-ink/15 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.10)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_4px_12px_rgba(15,23,42,0.06),0_24px_48px_-20px_rgba(15,23,42,0.18)] sm:p-6">
      {/* ── Portrait, identity, facts ───────────────────────────────────
          A two-column grid rather than nested flex rows. The portrait spans
          both rows from `sm`, so the facts sit directly under the name instead
          of waiting for the 120px portrait to end — which had left a band of
          empty card between the practice areas and the city. On a phone the
          portrait spans one row and the facts drop below it across the full
          width, where they have room to read. */}
      <div className="grid grid-cols-[88px_1fr] gap-x-4 sm:grid-cols-[120px_1fr] sm:gap-x-6">
        <Link
          href={profileHref}
          aria-label={`View ${name}'s profile`}
          className="relative h-[88px] w-[88px] shrink-0 self-start overflow-hidden rounded-2xl bg-slate-100 sm:row-span-2 sm:h-[120px] sm:w-[120px]"
        >
          <Avatar
            src={photo}
            name={name}
            size="xl"
            className="!h-full !w-full !rounded-2xl !bg-slate-100 !text-3xl !text-slate-400 transition-transform duration-500 group-hover:scale-[1.06] sm:!text-4xl"
          />
        </Link>

        <div className="flex min-w-0 flex-1 flex-col justify-center sm:justify-start">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Link href={profileHref}>
                <h3 className="truncate text-xl font-bold leading-tight text-slate-900 transition-colors hover:text-primary sm:text-2xl">
                  {name}
                </h3>
              </Link>
              {practiceArea && (
                <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-500 sm:truncate sm:text-[15px]">
                  {practiceArea}
                </p>
              )}
            </div>

            {/* The rate, stacked so the figure reads first and the duration
                qualifies it — a single inline string buried the number. Hidden
                on a phone, where it reappears in the badge row below. */}
            <FeePill
              plan={cheapestPlan}
              fee={consultationFee}
              className="hidden sm:block"
            />
          </div>
        </div>

        {/* Facts and status. Full width under the portrait on a phone — in the
            right-hand column they had about 150px to live in, so the city, the
            years and the languages each took a cramped line and half of them
            ended in an ellipsis. From `sm` they return beside the portrait. */}
        <div className="col-span-2 sm:col-span-1 sm:col-start-2">
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-slate-600 sm:mt-4 sm:gap-x-5 sm:gap-y-2 sm:text-sm">
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <MapPin className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              <span className="truncate">
                {city}, {state}
              </span>
              {distanceLabel && (
                <span className="shrink-0 font-semibold text-primary">· {distanceLabel}</span>
              )}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Briefcase className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              {formatExperience(experience)}
            </span>
            {languages.length > 0 && (
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <Languages className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                <span className="truncate">{languages.join(', ')}</span>
              </span>
            )}
            {/* Shown only once earned — a lawyer with no reviews gets nothing
                rather than a "New" badge that reads as a warning. */}
            {rating > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" aria-hidden="true" />
                <span className="font-semibold text-slate-900">{rating.toFixed(1)}</span>
                <span className="text-slate-400">({reviews})</span>
              </span>
            )}
          </div>

          {/* Status only — never decoration. The rate joins this row on a
              phone, where the corner it normally sits in belongs to the name. */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <FeePill plan={cheapestPlan} fee={consultationFee} className="sm:hidden" />
            {verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Verified
              </span>
            )}
            <PresenceIndicator id={advocate._id} variant="profile" />
          </div>
        </div>
      </div>

      {/* ── Through to the full profile ────────────────────────────────── */}
      <Link
        href={profileHref}
        className="group/link mt-5 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary-dark sm:mt-6"
      >
        View Full Profile
        <ArrowRight
          className="h-4 w-4 transition-transform duration-200 group-hover/link:translate-x-1"
          aria-hidden="true"
        />
      </Link>

      {/* ── Contact ─────────────────────────────────────────────────── */}
      <div className="mt-auto grid grid-cols-3 gap-2 border-t border-slate-100 pt-5 [&>*]:min-w-0 sm:gap-3 sm:pt-6">
        <CardContactActions
          contact={contact}
          name={name}
          advocateId={advocate._id}
          plans={advocatePlans(consultationPlans)}
          videoPlans={advocatePlans(videoPlans)}
          audioPlans={advocatePlans(audioPlans)}
        />
      </div>
    </article>
  );
}
