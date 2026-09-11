import Link from 'next/link';
import { MapPin, Star, BadgeCheck, ArrowRight, CalendarDays, Languages } from 'lucide-react';
import { Avatar } from '@/components/ui';
import { advocateProfilePath } from '@/utils/advocateUrl';
import { advocateRates } from '@/constants/callRates';
import { slotsFor } from '@/constants/consultationSlots';
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
 * Three columns on a wide screen: the portrait, then who the lawyer is, then
 * what it costs and the way in. That order is the order the questions get
 * asked — is this the right sort of lawyer, and can I afford to ask them — and
 * putting the answer to the second one in a column of its own means a visitor
 * comparing six lawyers reads six prices down a straight line instead of
 * hunting for each one inside a different card.
 *
 * On a phone the three columns cannot survive, but a plain stack wasted the
 * card: the portrait sat alone on a line of its own with empty space beside
 * it, the View Profile button squeezed the name down to "Adv. Sudhakar Ku…",
 * and Call, Chat and Video took three full-width rows. So below `sm` the
 * portrait and the name share the top row, the facts and tags run the card's
 * full width under them, and Call, Chat, Video and View Profile sit two by two
 * at the bottom, where a thumb lands.
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

  // The slot quoted when there is no per-minute rate to show — see the grid
  // card for why the two are never shown together.
  const hasPerMinute = chatRate > 0 || audioRate > 0 || videoRate > 0;
  const bookSlot = hasPerMinute ? null : slotsFor(advocate, 'chat')[0] || null;

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

  const profileButton =
    'items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-primary/[0.07] text-[13px] font-semibold text-primary shadow-sm transition-colors hover:border-primary hover:bg-primary hover:text-white';

  return (
    <article
      className={`group relative flex flex-col gap-3.5 rounded-2xl border ${HAIRLINE} bg-white p-4 ${CARD_SHADOW} ${CARD_SHADOW_HOVER} transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/25 sm:flex-row sm:items-center sm:gap-5 sm:p-5`}
    >
      {/* Portrait and details. A grid so the same markup can put the facts
          beside the portrait on a wide screen and under it on a phone. */}
      <div className="grid min-w-0 flex-1 grid-cols-[76px_minmax(0,1fr)] gap-x-3.5 sm:grid-cols-[100px_minmax(0,1fr)] sm:gap-x-5">
        {/* Portrait. A rounded rectangle, not a disc: a disc crops a head shot
            to the face and throws away the gown and the bookcase, which on
            this site are half of what says "lawyer". */}
        <Link
          href={profileHref}
          aria-label={`View ${name}'s profile`}
          className="relative h-[92px] w-[76px] overflow-hidden rounded-xl bg-slate-100 sm:row-span-2 sm:h-[116px] sm:w-[100px] sm:self-center sm:rounded-2xl"
        >
          <Avatar
            src={photo}
            name={name}
            size="xl"
            className="!h-full !w-full !rounded-none !bg-slate-100 !text-3xl !text-slate-400"
          />
        </Link>

        {/* Who they are. */}
        <div className="min-w-0 self-center sm:self-end">
          {/* Name on the left and, from `sm` up, the way into the profile on
              the right of the same line. On a phone that button took half the
              line and cut the name short, so there it moves to the bottom of
              the card. */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <Link href={profileHref} className="min-w-0">
                <h3 className="text-[16px] font-bold leading-snug text-ink transition-colors group-hover:text-primary sm:truncate sm:text-[17px]">
                  {name}
                  {verified && (
                    <BadgeCheck
                      className="ml-1 inline-block h-4 w-4 -translate-y-px align-middle text-primary sm:hidden"
                      aria-label="Verified"
                    />
                  )}
                </h3>
              </Link>
              {verified && (
                <BadgeCheck className="hidden h-4 w-4 shrink-0 text-primary sm:block" aria-label="Verified" />
              )}
              <PresenceIndicator id={advocate._id} variant="label" />
            </div>

            <Link href={profileHref} className={`hidden h-9 shrink-0 px-3.5 sm:inline-flex ${profileButton}`}>
              View Profile
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>

          <p className="mt-0.5 truncate text-[13px] text-ink/55 sm:text-[13.5px]">{standing}</p>

          {Number(rating) > 0 && (
            <p className="mt-1 flex items-center gap-1.5 text-[13px] sm:mt-1.5">
              <Star className="h-3.5 w-3.5 shrink-0 fill-accent text-accent" aria-hidden="true" />
              <span className="font-bold text-ink">{Number(rating).toFixed(1)}</span>
              <span className="text-ink/45">
                ({reviews} {reviews === 1 ? 'review' : 'reviews'})
              </span>
            </p>
          )}
        </div>

        {/* The facts and the tags: under the portrait's row, across the full
            card, on a phone; beside the portrait from `sm` up. */}
        <div className="col-span-2 mt-3 min-w-0 sm:col-span-1 sm:col-start-2 sm:mt-0 sm:self-start">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] text-ink/60 sm:mt-2">
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
      </div>

      {/* What it costs, and the way in. Its own column on a wide screen so six
          cards line their prices up; a rule above it on a phone, where it sits
          under the details instead. */}
      <div
        className={`flex shrink-0 flex-col justify-center gap-2.5 border-t ${HAIRLINE} pt-3.5 sm:w-[204px] sm:self-stretch sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0`}
      >
        {/* The same rule as the grid card: a lawyer with no per-minute rate
            quotes a bookable slot here, so no card goes out without a price. */}
        {bookSlot && (
          <p className="rounded-xl border border-dashed border-emerald-300/70 bg-emerald-50/60 px-3 py-2 text-center text-[12.5px] text-emerald-800/70">
            Book {bookSlot.minutes} min{' '}
            <span className="text-[14px] font-bold text-emerald-900">₹{bookSlot.price.toLocaleString('en-IN')}</span>
          </p>
        )}

        {/* The three live channels, each labelled with its rate. One per row in
            the wide card's narrow column; two by two on a phone, with View
            Profile as the fourth, where three full-width rows made every card
            twice the height of the lawyer it described. */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
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

          {/* On a phone, View Profile is the fourth tile of the two-by-two,
              the same height as the three beside it. */}
          <Link href={profileHref} className={`flex h-12 sm:hidden ${profileButton}`}>
            View Profile
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
