import Link from 'next/link';
import { MapPin, Star, BadgeCheck, ArrowRight, CalendarDays, Languages } from 'lucide-react';
import { Avatar } from '@/components/ui';
import { advocateProfilePath } from '@/utils/advocateUrl';
import { advocateRates } from '@/constants/callRates';
import CardContactActions from './CardContactActions';
import PresenceIndicator from '@/components/consultation/PresenceIndicator';

/** Hairline used for the card edge and the rule inside it. */
const HAIRLINE = 'border-[#E8ECF2]';

/**
 * Resting elevation, in three layers rather than one — see AdvocateGridCard for
 * why. The same values, so a list card and a grid card sit at the same height
 * above the page.
 */
const CARD_SHADOW =
  'shadow-[0_1px_1px_rgba(30,58,95,0.04),0_4px_8px_-4px_rgba(30,58,95,0.06),0_12px_28px_-16px_rgba(30,58,95,0.14)]';
const CARD_SHADOW_HOVER =
  'hover:shadow-[0_2px_2px_rgba(30,58,95,0.05),0_8px_16px_-6px_rgba(30,58,95,0.10),0_28px_52px_-24px_rgba(30,58,95,0.28)]';

/** One fact with its icon, coloured so the eye can jump to the one it wants. */
function Fact({ icon: Icon, tone, children }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <Icon className={`h-3.5 w-3.5 shrink-0 ${tone}`} aria-hidden="true" />
      <span className="truncate">{children}</span>
    </span>
  );
}

/**
 * AdvocateListCard — the lawyer card for the directory, one per row.
 *
 * Three columns rather than the grid card's stack: the portrait, then who the
 * lawyer is, then what it costs and the way in. That order is the order the
 * questions get asked — is this the right sort of lawyer, and can I afford to
 * ask them — and putting the answer to the second one in a column of its own
 * means a visitor comparing six lawyers reads six prices down a straight line
 * instead of hunting for each one inside a different card.
 *
 * It is the same record and the same actions as the grid card. What differs is
 * only the arrangement: with a filter sidebar beside it the results column is
 * around 880px, which is too narrow for three cards across and far too wide for
 * one stacked card, but exactly right for a row.
 *
 * Below `sm` the three columns fold into the stack the grid card already uses —
 * a row cannot survive a 390px screen, and pretending otherwise gives you a
 * portrait the size of a stamp beside two words per line.
 *
 * Presentational: receives a single `advocate` record.
 *
 * @param {object} props
 * @param {object} props.advocate
 */
export default function AdvocateListCard({ advocate }) {
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
  } = advocate;

  const profileHref = `/lawyers/${advocateProfilePath(advocate)}`;
  const { chat: chatRate, audio: audioRate, video: videoRate } = advocateRates(advocate);

  // "Advocate · Civil Law" — standing and headline practice, the two things a
  // name alone doesn't say.
  const standing = [designation || 'Advocate', specializations[0]].filter(Boolean).join(' · ');

  // Three tags here rather than the grid card's two: a row is wider than a
  // column, and the third one fits without pushing anything onto a new line.
  const tags = specializations.slice(0, 3);
  const extraTags = Math.max(0, specializations.length - tags.length);

  const experienceLabel = `${Math.max(0, Math.round(Number(experience) || 0))}+ yrs`;
  const languageLabel = languages.length
    ? languages.slice(0, 2).join(', ') + (languages.length > 2 ? ` +${languages.length - 2}` : '')
    : '';
  const place = [city, state].filter(Boolean).join(', ');

  return (
    <article
      className={`group relative flex flex-col gap-4 rounded-2xl border ${HAIRLINE} bg-white p-4 ${CARD_SHADOW} ${CARD_SHADOW_HOVER} transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/25 sm:flex-row sm:items-center sm:gap-5 sm:p-5`}
    >
      {/* Portrait. A rounded rectangle, not a disc: a disc crops a head shot to
          the face and throws away the gown and the bookcase, which on this site
          are half of what says "lawyer". */}
      <Link
        href={profileHref}
        aria-label={`View ${name}'s profile`}
        className="relative h-[92px] w-[92px] shrink-0 overflow-hidden rounded-2xl bg-slate-100 sm:h-[116px] sm:w-[100px]"
      >
        <Avatar
          src={photo}
          name={name}
          size="xl"
          className="!h-full !w-full !rounded-none !bg-slate-100 !text-3xl !text-slate-400"
        />
      </Link>

      {/* Who they are. */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link href={profileHref} className="min-w-0">
            <h3 className="truncate text-[17px] font-bold leading-snug text-ink transition-colors group-hover:text-primary">
              {name}
            </h3>
          </Link>
          {verified && (
            <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-label="Verified" />
          )}
          <PresenceIndicator id={advocate._id} variant="label" />
        </div>

        <p className="mt-0.5 truncate text-[13.5px] text-ink/55">{standing}</p>

        {Number(rating) > 0 && (
          <p className="mt-1.5 flex items-center gap-1.5 text-[13px]">
            <Star className="h-3.5 w-3.5 shrink-0 fill-accent text-accent" aria-hidden="true" />
            <span className="font-bold text-ink">{Number(rating).toFixed(1)}</span>
            <span className="text-ink/45">
              ({reviews} {reviews === 1 ? 'review' : 'reviews'})
            </span>
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] text-ink/60">
          {place && <Fact icon={MapPin} tone="text-emerald-600">{place}</Fact>}
          <Fact icon={CalendarDays} tone="text-accent">{experienceLabel}</Fact>
          {languageLabel && (
            <Fact icon={Languages} tone="text-primary">{languageLabel}</Fact>
          )}
        </div>

        {tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {tags.map((t) => (
              <span
                key={t}
                className="rounded-lg bg-primary/[0.06] px-2 py-1 text-[11.5px] font-semibold text-primary"
              >
                {t}
              </span>
            ))}
            {extraTags > 0 && (
              <span className="rounded-lg bg-ink/5 px-2 py-1 text-[11.5px] font-semibold text-ink/50">
                +{extraTags}
              </span>
            )}
          </div>
        )}
      </div>

      {/* What it costs, and the way in. Its own column on a wide screen so six
          cards line their prices up; a rule above it on a phone, where it sits
          under the details instead. */}
      <div
        className={`flex shrink-0 flex-col justify-center gap-2.5 border-t ${HAIRLINE} pt-3.5 sm:w-[204px] sm:self-stretch sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0`}
      >

        {/* The three live channels, labelled, one per row. Labels matter
            here: a bare phone glyph does not tell anyone that pressing it
            starts a call charged by the minute. And a row of three sharing a
            line reads as a segmented control — one thing with three settings
            — where these are three separate ways to start a paid
            conversation, each at its own rate. */}
        <div className="grid gap-2">
          <CardContactActions
            variant="quiet"
            contact={contact}
            name={name}
            advocateId={advocate._id}
            slotPrices={advocate.slotPrices}
            chatRate={chatRate}
            videoRate={videoRate}
            audioRate={audioRate}
          />
        </div>

        <Link
          href={profileHref}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-primary-light/95 via-primary to-primary-dark px-4 text-[13.5px] font-semibold text-white shadow-brand transition-all hover:-translate-y-0.5 hover:shadow-brand-hover"
        >
          View Profile
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>


      </div>
    </article>
  );
}
