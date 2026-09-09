import Link from 'next/link';
import { MapPin, Check, Star, ArrowRight, CalendarDays, Languages } from 'lucide-react';
import { Avatar } from '@/components/ui';
import { advocateProfilePath } from '@/utils/advocateUrl';
import { advocateRates } from '@/constants/callRates';
import { slotsFor, CARD_SLOT_MINUTES } from '@/constants/consultationSlots';
import CardContactActions from './CardContactActions';
import PresenceIndicator from '@/components/consultation/PresenceIndicator';

/** Hairline used for the card edge and the rules inside it. */
const HAIRLINE = 'border-[#E8ECF2]';

/**
 * The card's resting elevation, in three layers rather than one.
 *
 * A single blurred shadow reads as fog under the card; stacking a tight
 * contact shadow, a short ambient one and a wide soft one is how a real object
 * sits on a surface — the eye reads the card as lifted rather than smudged.
 * All three are tinted with the brand navy instead of neutral black, so the
 * lift belongs to this palette and not to a generic UI kit.
 */
const CARD_SHADOW =
  'shadow-[0_1px_1px_rgba(30,58,95,0.04),0_4px_8px_-4px_rgba(30,58,95,0.06),0_12px_28px_-16px_rgba(30,58,95,0.14)]';

/**
 * And on hover: the same three layers, deeper and thrown further, which reads
 * as the card rising towards the pointer rather than merely darkening.
 */
const CARD_SHADOW_HOVER =
  'hover:shadow-[0_2px_2px_rgba(30,58,95,0.05),0_8px_16px_-6px_rgba(30,58,95,0.10),0_28px_52px_-24px_rgba(30,58,95,0.28)]';

/**
 * One fact with its icon.
 *
 * The icon carries the colour while the words stay grey: at this size a grey
 * icon beside grey text is a smudge, and a hue per fact is what lets the eye
 * jump to the one it wants — place, standing, language — without reading all
 * three. The three hues are the ones the contact buttons already use, so the
 * card has one palette rather than two.
 *
 * The icons are also what separates one fact from the next. There used to be a
 * "·" between them, which on a card narrow enough to wrap — most of them, once
 * a city is spelled "Moradabad, Uttar Pradesh" — was left dangling at the end
 * of a line, pointing at nothing.
 */
function Fact({ icon: Icon, tone, children }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <Icon className={`h-3.5 w-3.5 shrink-0 ${tone}`} aria-hidden="true" />
      <span className="truncate">{children}</span>
    </span>
  );
}

/**
 * AdvocateGridCard — the lawyer card for the directory grid.
 *
 * Read top to bottom it answers the questions in the order a client asks them:
 * can I reach this person right now and what do they cost, who are they, where
 * and how experienced, what do they practise, and finally how to start.
 *
 * The two things that decide whether a card is worth reading at all — the
 * status and the rate — share a strip of their own above everything else.
 * They used to be scattered: presence as a bare dot on the portrait's corner,
 * the rate as a ticket wedged in beside the name. The dot asked the reader to
 * know the convention and to be able to tell green from grey, and the ticket
 * squeezed the name column so hard that anything longer than "Adv Manoj
 * Sharma" was truncated. On the strip the status carries the word Online
 * beside its dot, and the name gets the full width of its column back.
 *
 * Below the portrait everything runs the whole width of the card, so the
 * facts and the practice areas share one left edge and one wrapping rule
 * rather than being folded into the narrow column beside the photograph.
 *
 * Presentational: receives a single `advocate` record.
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
  } = advocate;

  const profileHref = `/lawyers/${advocateProfilePath(advocate)}`;
  const { chat: chatRate, audio: audioRate, video: videoRate } = advocateRates(advocate);

  // The two blocks the card quotes. Every lawyer has a price for these — their
  // own if they set one, the platform's if they did not — so unlike the old
  // per-minute figure there is no case where the ticket is simply absent, and
  // no card that silently offers nothing because a rate was left at zero.
  // Chat prices, because that is the channel CONSULTATION_CHANNELS marks for
  // the card — a card has one line and there are nine figures behind it.
  const cardSlots = slotsFor(advocate, 'chat').filter((s) =>
    CARD_SLOT_MINUTES.includes(s.minutes)
  );

  // "Advocate · Civil Law" — standing and headline practice, the two things a
  // name alone doesn't say. Every advocate is at least an Advocate, so the
  // designation falls back rather than leaving the line half empty.
  const standing = [designation || 'Advocate', specializations[0]].filter(Boolean).join(' · ');

  // Two tags and a counter, which is what fits on one line beside the way in
  // to the profile. Three fitted only when all three were short: "Criminal
  // Law, Property Law, Civil Law, +4" wrapped, and the wrapped row pushed
  // "View Profile" out of line with the tags it was sitting beside.
  // The cheapest block on offer — what "starts at" means.
  const cheapestSlot = cardSlots.length
    ? cardSlots.reduce((a, b) => (b.price < a.price ? b : a))
    : null;

  const tags = specializations.slice(0, 2);
  const extraTags = Math.max(0, specializations.length - tags.length);

  const experienceLabel = `${Math.max(0, Math.round(Number(experience) || 0))}+ yrs`;
  // Two languages and a count. They run long in India, and the full list would
  // push the facts onto a line of their own.
  const languageLabel = languages.length
    ? languages.slice(0, 2).join(', ') + (languages.length > 2 ? ` +${languages.length - 2}` : '')
    : '';

  return (
    <article
      className={`group relative flex h-full flex-col rounded-2xl border ${HAIRLINE} bg-white p-[18px] ${CARD_SHADOW} ${CARD_SHADOW_HOVER} transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-primary/25 sm:p-5`}
    >
      {/* One link stretched over the whole card, so anywhere that is not a
          control opens the profile. It sits underneath everything (z-0) and the
          three contact buttons are lifted above it, which is what keeps them
          clickable — and it is a real anchor rather than an onClick, so the
          profile still opens in a new tab on middle-click and reads as a link
          to a screen reader. */}
      <Link href={profileHref} className="absolute inset-0 z-0 rounded-2xl">
        <span className="sr-only">View {name}&apos;s profile</span>
      </Link>

      {/* ── Status + rate ─────────────────────────────────────────────── */}
      {/* The two facts that decide whether the rest of the card is worth
          reading, on a strip of their own. Nothing else competes with them
          here, and nothing below has to make room for them. */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <PresenceIndicator id={advocate._id} variant="label" />

        {/* What it costs to start, as one figure. The card used to quote
            both blocks — "10 min ₹200 · 30 min ₹500" — which is a price
            list, and a card in a row of three is scanned rather than read:
            what a scan wants is the number to compare. The full list is on
            the profile, one click away. */}
        {cheapestSlot && (
          <span className="shrink-0 whitespace-nowrap rounded-full bg-emerald-50 px-3 py-1.5 text-[12px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
            Starts at{' '}
            <span className="text-[13.5px] font-bold">₹{cheapestSlot.price.toLocaleString('en-IN')}</span>
            <span className="ml-1 font-medium text-emerald-600/70">· {cheapestSlot.minutes} mins</span>
          </span>
        )}
      </div>

      {/* ── Identity ──────────────────────────────────────────────────── */}
      {/* Centred against the portrait rather than hung from its top edge. Most
          lawyers have no reviews yet, so the text beside the photograph is two
          lines against a 68px circle — aligned to the top it left a wedge of
          empty card under the name and the portrait looked dropped in. */}
      <div className="flex items-center gap-3.5">
        {/* The portrait, with whether this lawyer can be reached right now
            marked on its corner — the shorthand every messaging app uses, so
            the answer is there before a word is read. The strip above still
            spells it out for anyone who wants it in words. */}
        <span className="relative block h-[68px] w-[68px] shrink-0 sm:h-[72px] sm:w-[72px]">
          <span className="block h-full w-full overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200/80">
            <Avatar
              src={photo}
              name={name}
              size="lg"
              className="!h-full !w-full !rounded-none !bg-slate-100 !text-2xl !text-slate-400"
            />
          </span>
          <span className="absolute bottom-0 right-0">
            <PresenceIndicator id={advocate._id} variant="check" />
          </span>
        </span>

        {/* The name has the whole column now that the rate has moved up, which
            is the difference between "Advocate Manoj Sharma" and "Advocate
            Manoj …". It still truncates, but only when it genuinely runs out. */}
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <h3 className="truncate text-[16px] font-bold leading-tight text-slate-900 transition-colors group-hover:text-primary sm:text-[17px]">
              {name}
            </h3>
            {/* A filled disc rather than an outlined tick: at this size an
                outline reads as decoration, a solid badge reads as a stamp. */}
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

          <p className="mt-1 truncate text-[13px] font-medium text-slate-500">{standing}</p>

          {rating > 0 && (
            <p className="mt-1.5 flex items-center gap-1.5 text-[13px]">
              <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" aria-hidden="true" />
              <span className="font-bold text-slate-900">{rating.toFixed(1)}</span>
              <span className="truncate text-slate-500">
                ({reviews} {reviews === 1 ? 'review' : 'reviews'})
              </span>
            </p>
          )}
        </div>
      </div>

      {/* ── Facts ─────────────────────────────────────────────────────── */}
      {/* Full width under the portrait rather than folded into the column
          beside it. In that column a city and its state — "Moradabad, Uttar
          Pradesh" — took the line on its own and pushed the other two facts
          onto a second one; across the card all three usually fit. */}
      <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] text-slate-600">
        <Fact icon={MapPin} tone="text-primary">
          {city}
          {state ? `, ${state}` : ''}
        </Fact>
        <Fact icon={CalendarDays} tone="text-[#B08D2A]">{experienceLabel}</Fact>
      </div>

      {languages.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {languages.slice(0, 3).map((l) => (
            <span
              key={l}
              className="rounded-md bg-primary/[0.06] px-2 py-0.5 text-[11.5px] font-semibold text-primary"
            >
              {l}
            </span>
          ))}
        </div>
      )}

      {/* ── Expertise ─────────────────────────────────────────────────── */}
      {/* Tags on the left, the way in on the right. "View Profile" is a cue,
          not a control — the whole card already opens the profile — so it is
          plain text with no face of its own, and it moves with the card's own
          hover rather than owning one. Both sides are held to a single line:
          `min-w-0` plus `flex-nowrap` lets the tags shrink instead of wrapping
          underneath and dragging the cue out of line with them. */}
      {/* Tags on the left, the way in on the right — one line rather than two.
          Given a line of its own the button was right-aligned against an empty
          left half, which is a strip of card doing nothing. `min-w-0` plus
          `flex-nowrap` lets the tags shrink instead of wrapping underneath and
          dragging the button out of line with them. */}
      <div className="mb-1.5 mt-3 flex items-center gap-2">
        <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-1.5 overflow-hidden">
          {tags.map((tag) => (
            <span
              key={tag}
              className="truncate rounded-full bg-slate-50 px-2.5 py-1 text-[12px] font-semibold text-slate-700 ring-1 ring-inset ring-slate-200"
            >
              {tag}
            </span>
          ))}
          {extraTags > 0 && (
            <span className="shrink-0 rounded-full bg-primary/[0.08] px-2.5 py-1 text-[12px] font-semibold text-primary">
              +{extraTags}
            </span>
          )}
        </div>

        <Link
          href={profileHref}
          className="relative z-10 inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-ink/12 bg-surface px-2.5 text-[12px] font-semibold text-primary transition-colors hover:border-primary/40 hover:bg-primary/[0.04]"
        >
          Profile
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </div>
      {/* ── Actions ───────────────────────────────────────────────────── */}
      {/* Lifted above the stretched link so these three are still buttons and
          not part of the card's own click target. `mt-auto` pins the row to
          the foot of the card, keeping it level across a row of the grid
          however short one lawyer's details are. */}
      <div
        className={`relative z-10 mt-auto grid grid-cols-3 gap-1.5 border-t ${HAIRLINE} pt-4 [&>*]:min-w-0`}
      >
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

    </article>
  );
}
