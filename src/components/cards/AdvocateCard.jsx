import Link from 'next/link';
import { MapPin, BadgeCheck, Star, Briefcase, Languages, ArrowRight } from 'lucide-react';
import { Avatar } from '@/components/ui';
import { formatExperience } from '@/utils/formatters';
import { formatDistance } from '@/utils/distance';
import { advocateProfilePath } from '@/utils/advocateUrl';
import { advocateRates } from '@/constants/callRates';
import CardContactActions from './CardContactActions';
import PresenceIndicator from '@/components/consultation/PresenceIndicator';

/** Hairline used for the card edge and the rules inside it. */
const HAIRLINE = 'border-[#E8ECF2]';

/**
 * The consultation rate as a pill, for the desktop card's top corner.
 *
 * One line — "₹24/min" — rather than the amount stacked over its unit. A rate
 * is read as a single quantity, and splitting it across two lines made the
 * pill twice as tall to say the same thing.
 *
 * `amount` is already formatted; `quoted` is false when the lawyer has neither
 * a live rate nor a flat fee set, in which case the pill says so rather than
 * advertising a free consultation with "₹0".
 */
function FeePill({ amount, unit, quoted, className = '' }) {
  return (
    <div
      className={`shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-center sm:rounded-2xl sm:px-4 sm:py-2 ${className}`}
    >
      {quoted ? (
        <p className="whitespace-nowrap text-base font-bold leading-tight text-slate-900 sm:text-lg">
          ₹{amount}
          <span className="text-[11px] font-semibold text-slate-500 sm:text-xs">/{unit}</span>
        </p>
      ) : (
        <>
          <p className="text-base font-bold leading-tight text-slate-900 sm:text-lg">On request</p>
          <p className="mt-0.5 text-[11px] font-medium text-slate-500 sm:text-xs">ask the lawyer</p>
        </>
      )}
    </div>
  );
}

/** One fact with its icon, in the muted grey the facts share. */
function Fact({ icon: Icon, children, className = '' }) {
  return (
    <span className={`inline-flex min-w-0 items-center gap-2 ${className}`}>
      <Icon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
      {children}
    </span>
  );
}

/** The "Verified" pill — a blue check on a blue tint, matching the Online pill. */
function VerifiedChip() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/[0.08] px-2.5 py-1 text-xs font-semibold text-primary">
      <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
      Verified Lawyer
    </span>
  );
}

/**
 * AdvocateCard — the directory listing card for a single lawyer.
 *
 * Two layouts, one component, because a phone and a desktop want genuinely
 * different cards here and squeezing one into the other is what made the phone
 * version feel cramped:
 *
 *   below `sm`  a stacked card — portrait and identity, status chips, the facts
 *               one per line, the fee given a block of its own, then the three
 *               actions and the profile link, each group separated by a rule.
 *               Nothing competes for horizontal room, so nothing is truncated
 *               to fit and every tap target clears 44px.
 *
 *   from `sm`   the media card — portrait as a full-height tile down the left,
 *               everything else in the column beside it.
 *
 * Only one is ever displayed; the other is `display:none`, so it is also hidden
 * from assistive technology rather than read out twice.
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
    contact,
    _distance,
  } = advocate;

  // Present only during a "near me" search — how far this office is from the user.
  const distanceLabel = typeof _distance === 'number' ? formatDistance(_distance) : '';

  // The lawyer's per-minute rates, for the buttons this card offers.
  const { chat: chatRate, audio: audioRate, video: videoRate } = advocateRates(advocate);

  const profileHref = `/lawyers/${advocateProfilePath(advocate)}`;
  const practiceArea = specializations.slice(0, 2).join(' · ');

  // The headline figure is the cheapest live rate the lawyer offers, since that
  // is what a client actually pays to reach them; only a lawyer with no live
  // channel at all falls back to their flat office fee, and one with neither
  // has no figure to show — "₹0" would read as a free consultation, so both
  // layouts fall back to "On request". Grouped with the Indian digit
  // separators, ₹2,000 rather than ₹2000.
  const liveRates = [chatRate, audioRate, videoRate].filter((r) => r > 0);
  const cheapestRate = liveRates.length ? Math.min(...liveRates) : 0;
  const feeAmount = cheapestRate || consultationFee;
  const feeUnit = cheapestRate ? 'min' : 'consult';
  const feeQuoted = Number(feeAmount) > 0;
  const feeText = Number(feeAmount || 0).toLocaleString('en-IN');

  const actions = (
    <CardContactActions
      contact={contact}
      name={name}
      advocateId={advocate._id}
      chatRate={chatRate}
      videoRate={videoRate}
      audioRate={audioRate}
    />
  );

  return (
    <>
      {/* ══ Phone ══════════════════════════════════════════════════════ */}
      <article
        className={`flex h-full flex-col rounded-[18px] border ${HAIRLINE} bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-16px_rgba(16,24,40,0.16)] sm:hidden`}
      >
        {/* Portrait and identity side by side. Only the name and practice area
            sit in the narrow column beside the photo; everything after it takes
            the full width of the card, where it has room to read. */}
        <div className="flex items-start gap-4">
          <Link
            href={profileHref}
            aria-label={`View ${name}'s profile`}
            className="relative h-[80px] w-[80px] shrink-0 overflow-hidden rounded-2xl bg-slate-100"
          >
            <Avatar
              src={photo}
              name={name}
              size="xl"
              className="!h-full !w-full !rounded-none !bg-slate-100 !text-3xl !text-slate-400"
            />
          </Link>

          <div className="min-w-0 flex-1">
            <Link href={profileHref} className="flex min-w-0 items-center gap-1.5">
              <h3 className="truncate text-[18px] font-bold leading-snug text-slate-900">
                {name}
              </h3>
              {verified && (
                <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-label="Verified" />
              )}
            </Link>
            {practiceArea && (
              <p className="mt-1 text-sm font-medium leading-snug text-slate-500">
                {practiceArea}
              </p>
            )}
          </div>
        </div>

        {/* Facts across the full card. City and years pair on one line where
            they fit; languages take their own. */}
        <div className="mt-3.5 space-y-2 text-[13.5px] text-slate-600">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Fact icon={MapPin}>
              <span className="truncate">
                {city}, {state}
              </span>
              {distanceLabel && (
                <span className="shrink-0 font-semibold text-primary">· {distanceLabel}</span>
              )}
            </Fact>
            <Fact icon={Briefcase}>{formatExperience(experience)}</Fact>
          </div>
          {languages.length > 0 && (
            <Fact icon={Languages} className="w-full">
              <span className="truncate">{languages.join(', ')}</span>
            </Fact>
          )}
        </div>

        {/* Rate, and whether the advocate can be reached right now — the two
            things the visitor is actually deciding on, side by side. Rating joins
            them once earned; a lawyer with no reviews gets nothing rather than
            "0.0 (0)", which reads as a poor score instead of a new profile. */}
        <div className="mt-3.5 flex flex-wrap items-center gap-3">
          <FeePill amount={feeText} unit={feeUnit} quoted={feeQuoted} />
          <PresenceIndicator id={advocate._id} variant="profile" />
          {verified && <VerifiedChip />}
          {rating > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[13px]">
              <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" aria-hidden="true" />
              <span className="font-bold text-slate-900">{rating.toFixed(1)}</span>
              <span className="text-slate-500">({reviews})</span>
            </span>
          )}
        </div>

        <Link
          href={profileHref}
          className="mt-3.5 inline-flex w-fit items-center gap-1.5 text-[15px] font-semibold text-primary active:text-primary-dark"
        >
          View Full Profile
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>

        {/* Actions — 44px tall, three to a row, never wrapping */}
        <div className={`mt-auto grid grid-cols-3 gap-2.5 border-t ${HAIRLINE} pt-3.5 [&>*]:min-w-0`}>
          <CardContactActions
            variant="mobile"
            contact={contact}
            name={name}
            advocateId={advocate._id}
            chatRate={chatRate}
            videoRate={videoRate}
            audioRate={audioRate}
          />
        </div>
      </article>

      {/* ══ Tablet and desktop ═════════════════════════════════════════ */}
      <article className="group hidden h-full grid-cols-[148px_minmax(0,1fr)] grid-rows-[auto_1fr] gap-x-5 rounded-3xl border-2 border-ink/15 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.10)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_4px_12px_rgba(15,23,42,0.06),0_24px_48px_-20px_rgba(15,23,42,0.18)] sm:grid lg:grid-cols-[162px_minmax(0,1fr)]">
        {/* Portrait — a full-height tile, inset by the card's own padding so it
            reads as a framed photograph rather than artwork bled to the edge.
            The width is set against that height: the card runs a little over
            200px tall inside its padding, so 162px keeps the tile near the 3:4
            a portrait wants rather than the strip it became at 124px. */}
        <Link
          href={profileHref}
          aria-label={`View ${name}'s profile`}
          className="relative row-span-2 h-full w-full overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-ink/[0.06]"
        >
          <Avatar
            src={photo}
            name={name}
            size="xl"
            className="!h-full !w-full !rounded-none !bg-slate-100 !text-5xl !text-slate-400 transition-transform duration-500 group-hover:scale-[1.04]"
          />
        </Link>

        {/* Identity */}
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={profileHref}>
              <h3 className="truncate text-xl font-bold leading-tight text-slate-900 transition-colors hover:text-primary">
                {name}
              </h3>
            </Link>
            {practiceArea && (
              <p className="mt-1 truncate text-sm font-semibold text-slate-500">
                {practiceArea}
              </p>
            )}
          </div>
          <FeePill
            amount={feeText}
            unit={feeUnit}
            quoted={feeQuoted}
          />
        </div>

        {/* Facts, status and actions */}
        <div className="mt-3.5 flex min-w-0 flex-col">
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
              <Fact icon={MapPin}>
                <span className="truncate">
                  {city}, {state}
                </span>
                {distanceLabel && (
                  <span className="shrink-0 font-semibold text-primary">· {distanceLabel}</span>
                )}
              </Fact>
              <Fact icon={Briefcase}>{formatExperience(experience)}</Fact>
              {rating > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" aria-hidden="true" />
                  <span className="font-semibold text-slate-900">{rating.toFixed(1)}</span>
                  <span className="text-slate-400">({reviews})</span>
                </span>
              )}
            </div>
            {languages.length > 0 && (
              <Fact icon={Languages}>
                <span className="truncate">{languages.join(', ')}</span>
              </Fact>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {verified && <VerifiedChip />}
            <PresenceIndicator id={advocate._id} variant="profile" />
            <Link
              href={profileHref}
              className="group/link ml-auto inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-primary transition-colors hover:text-primary-dark"
            >
              View Full Profile
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform duration-200 group-hover/link:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </div>

          <div className="mt-auto grid grid-cols-3 gap-2.5 border-t border-slate-100 pt-5 [&>*]:min-w-0">
            {actions}
          </div>
        </div>
      </article>
    </>
  );
}
