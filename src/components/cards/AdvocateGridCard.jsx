import Link from 'next/link';
import { MapPin, Check, Star, ArrowRight, BriefcaseBusiness, Languages } from 'lucide-react';
import { Avatar } from '@/components/ui';
import { advocateProfilePath } from '@/utils/advocateUrl';
import { advocateRates, formatRate } from '@/constants/callRates';
import CardContactActions from './CardContactActions';
import PresenceIndicator from '@/components/consultation/PresenceIndicator';
import PlanTierBadge from '@/components/shared/PlanTierBadge';

/**
 * The card's resting elevation, in three layers rather than one, tinted with
 * the brand navy: a tight contact shadow, a short ambient one and a wide soft
 * one read as a card lifted off the page rather than smudged onto it.
 */
const CARD_SHADOW =
  'shadow-[0_1px_1px_rgba(30,58,95,0.04),0_4px_8px_-4px_rgba(30,58,95,0.06),0_12px_28px_-16px_rgba(30,58,95,0.14)]';
const CARD_SHADOW_HOVER =
  'hover:shadow-[0_2px_2px_rgba(30,58,95,0.05),0_10px_20px_-8px_rgba(30,58,95,0.14),0_32px_60px_-28px_rgba(30,58,95,0.38)]';

/** One fact with its icon, both kept grey so the card stays calm. */
function Fact({ icon: Icon, tone, children }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <Icon className={`h-3.5 w-3.5 shrink-0 ${tone}`} aria-hidden="true" />
      <span className="truncate">{children}</span>
    </span>
  );
}

/**
 * AdvocateGridCard — the lawyer card for the directory grid and the home band.
 *
 * A light banner carries the two things that decide whether the card is worth
 * reading — whether the lawyer is online, and the badge — and the portrait
 * sits large across its lower edge, so a face is the first thing seen. Under
 * it: who they are, the lowest rate to start a consultation at, where they
 * practise, and the call / chat / video buttons pinned to the foot so a row of
 * cards lines up.
 *
 * The whole card opens the profile (one stretched link underneath); the
 * buttons and the Profile link are lifted above it so they stay controls.
 *
 * @param {object} props
 * @param {object} props.advocate
 */
export default function AdvocateGridCard({ advocate }) {
  const {
    name,
    photo,
    city,
    state,
    experience,
    rating,
    reviews,
    verified,
    designation,
    specializations = [],
    languages = [],
    contact,
    planId,
    planExpiresAt,
  } = advocate;

  const profileHref = `/lawyers/${advocateProfilePath(advocate)}`;
  const { chat: chatRate, audio: audioRate, video: videoRate } = advocateRates(advocate);
  // The cheapest way to start talking, for the "from" line.
  const lowestRate = Math.min(...[chatRate, audioRate, videoRate].map(Number).filter((r) => r > 0));

  const standing = [designation || 'Advocate', specializations[0]].filter(Boolean).join(' · ');
  const tags = specializations.slice(0, 2);
  const extraTags = Math.max(0, specializations.length - tags.length);
  const experienceLabel = `${Math.max(0, Math.round(Number(experience) || 0))}+ yrs exp`;
  const languageLabel = languages.length
    ? languages.slice(0, 2).join(', ') + (languages.length > 2 ? ` +${languages.length - 2}` : '')
    : '';

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-[#E6EAF1] bg-white ${CARD_SHADOW} ${CARD_SHADOW_HOVER} transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1.5 hover:border-primary/30`}
    >
      <Link href={profileHref} className="absolute inset-0 z-0 rounded-[22px]">
        <span className="sr-only">View {name}&apos;s profile</span>
      </Link>

      {/* ── Banner ────────────────────────────────────────────────────── */}
      <div className="relative h-[96px] shrink-0 overflow-hidden border-b border-[#E6EAF1] bg-gradient-to-br from-[#F3F6FA] to-[#E6ECF4]">
        {/* A soft glow in the corner that brightens on hover. */}
        <span
          className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-white/70 blur-2xl transition-opacity duration-500 group-hover:opacity-100 opacity-70"
          aria-hidden="true"
        />
        <span
          className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(circle_at_1px_1px,rgba(30,58,95,0.18)_1px,transparent_0)] [background-size:14px_14px]"
          aria-hidden="true"
        />
        <div className="relative flex items-center justify-between gap-3 px-4 pt-3.5 sm:px-5">
          <PresenceIndicator id={advocate._id} variant="label" />
          <PlanTierBadge planId={planId} planExpiresAt={planExpiresAt} />
        </div>
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4 sm:px-5 sm:pb-5">
        {/* ── Identity ────────────────────────────────────────────────── */}
        {/* The portrait rides the banner's lower half; the banner is tall
            enough that the status pill above stays clear of it. */}
        <div className="-mt-11 flex items-end gap-3.5">
          <span className="relative block h-[88px] w-[88px] shrink-0">
            <span className="block h-full w-full overflow-hidden rounded-[20px] bg-slate-100 shadow-[0_10px_24px_-10px_rgba(30,58,95,0.45)] ring-4 ring-white">
              <Avatar
                src={photo}
                name={name}
                size="xl"
                className="!h-full !w-full !rounded-none !bg-gradient-to-br !from-slate-100 !to-slate-200 !text-3xl !text-slate-400"
              />
            </span>
            <span className="absolute -bottom-0.5 -right-0.5">
              <PresenceIndicator id={advocate._id} variant="check" />
            </span>
          </span>

          {rating > 0 && (
            <span className="mb-1 ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-[12.5px] ring-1 ring-inset ring-slate-200">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
              <span className="font-bold text-slate-900">{rating.toFixed(1)}</span>
              <span className="text-slate-500">({reviews})</span>
            </span>
          )}
        </div>

        <div className="mt-3 min-w-0">
          <div className="flex min-w-0 items-center gap-1.5">
            <h3 className="truncate text-[17px] font-bold leading-tight text-slate-900 transition-colors group-hover:text-primary sm:text-[18px]">
              {name}
            </h3>
            {verified && (
              <span
                title="Verified lawyer"
                aria-label="Verified lawyer"
                className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-primary"
              >
                <Check className="h-3 w-3 text-white" strokeWidth={3.5} aria-hidden="true" />
              </span>
            )}
          </div>
          <p className="mt-1 truncate text-[13px] font-semibold text-primary/80">{standing}</p>
        </div>

        {/* ── Price ───────────────────────────────────────────────────── */}
        {Number.isFinite(lowestRate) && (
          <p className="mt-3 inline-flex w-fit items-baseline gap-1.5 rounded-xl bg-slate-50 px-3 py-1.5 ring-1 ring-inset ring-slate-200">
            <span className="text-[12px] font-medium text-slate-500">Consult from</span>
            <span className="text-[16px] font-bold text-slate-900">{formatRate(lowestRate)}</span>
          </p>
        )}

        {/* ── Facts ───────────────────────────────────────────────────── */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] text-slate-600">
          {(city || state) && (
            <Fact icon={MapPin} tone="text-slate-400">
              {city}
              {state ? `, ${state}` : ''}
            </Fact>
          )}
          <Fact icon={BriefcaseBusiness} tone="text-slate-400">{experienceLabel}</Fact>
          {languageLabel && <Fact icon={Languages} tone="text-slate-400">{languageLabel}</Fact>}
        </div>

        {/* ── Expertise + profile ─────────────────────────────────────── */}
        <div className="mb-4 mt-3 flex items-center gap-2">
          <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-1.5 overflow-hidden">
            {tags.map((tag) => (
              <span
                key={tag}
                className="truncate rounded-full bg-slate-100 px-2.5 py-1 text-[12px] font-medium text-slate-700"
              >
                {tag}
              </span>
            ))}
            {extraTags > 0 && (
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[12px] font-semibold text-slate-600">
                +{extraTags}
              </span>
            )}
          </div>

          <Link
            href={profileHref}
            className="relative z-10 inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 text-[12.5px] font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark"
          >
            Profile
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>

        {/* ── Actions ─────────────────────────────────────────────────── */}
        <div className="relative z-10 mt-auto grid grid-cols-3 gap-1.5 border-t border-[#E8ECF2] pt-4 [&>*]:min-w-0">
          <CardContactActions
            variant="clean"
            contact={contact}
            name={name}
            advocateId={advocate._id}
            slotPrices={advocate.slotPrices}
            chatRate={chatRate}
            videoRate={videoRate}
            audioRate={audioRate}
          />
        </div>
      </div>
    </article>
  );
}
