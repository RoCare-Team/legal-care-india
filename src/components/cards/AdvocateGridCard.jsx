import Link from 'next/link';
import { MapPin, Check, Star, ArrowRight, CalendarDays, Languages } from 'lucide-react';
import { Avatar } from '@/components/ui';
import { advocateProfilePath } from '@/utils/advocateUrl';
import { advocateRates } from '@/constants/callRates';
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
 * Laid out the way a client reads a person: the portrait and who they are on
 * the left, what they cost on the right, then what they practise, then how to
 * reach them. Everything above the rule is identity and credentials;
 * everything below it is an action.
 *
 * The portrait is a circle with a live status dot on its corner — the same
 * shorthand every messaging app uses, so "is this lawyer here right now" is
 * answered before a single word is read. That dot is the only place presence
 * is shown; it carries its own label for anyone who cannot see the colour, so
 * a second "Online / Offline" pill beside the facts was saying the same thing
 * twice and costing the card a line to do it.
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
    consultationFee,
    contact,
  } = advocate;

  const profileHref = `/lawyers/${advocateProfilePath(advocate)}`;
  const { chat: chatRate, audio: audioRate, video: videoRate } = advocateRates(advocate);

  // The headline figure is the cheapest live rate on offer — what it actually
  // costs to reach this lawyer. Only one with no live channel falls back to
  // their flat office fee, and one with neither shows nothing rather than "₹0",
  // which would read as a free consultation.
  const liveRates = [chatRate, audioRate, videoRate].filter((r) => r > 0);
  const cheapestRate = liveRates.length ? Math.min(...liveRates) : 0;
  const feeAmount = cheapestRate || consultationFee;
  const feeUnit = cheapestRate ? 'min' : 'consult';
  const feeQuoted = Number(feeAmount) > 0;

  // "Advocate · Civil Law" — standing and headline practice, the two things a
  // name alone doesn't say. Every advocate is at least an Advocate, so the
  // designation falls back rather than leaving the line half empty.
  const standing = [designation || 'Advocate', specializations[0]].filter(Boolean).join(' · ');

  // Three tags and a counter. A lawyer listing eight practice areas would
  // otherwise wrap to a second row and stand taller than the card beside it.
  const tags = specializations.slice(0, 3);
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

      {/* ── Identity + rate ───────────────────────────────────────────── */}
      <div className="flex items-start gap-3.5">
        <span className="relative shrink-0">
          <span className="block h-[68px] w-[68px] overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/80 sm:h-20 sm:w-20">
            <Avatar
              src={photo}
              name={name}
              size="lg"
              className="!h-full !w-full !rounded-none !bg-slate-100 !text-2xl !text-slate-400"
            />
          </span>
          <span className="absolute bottom-0 right-0">
            <PresenceIndicator id={advocate._id} variant="dot" />
          </span>
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
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

              <p className="mt-0.5 truncate text-[13px] font-medium text-slate-500">{standing}</p>

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

            {/* A torn ticket: dashed rule, tinted face, and a bite out of each
                side. The label is gone — "₹24/min" beside a lawyer's name is
                self-evidently what they charge, and spelling it out was a
                second line of type for no second piece of information. */}
            {feeQuoted && (
              <div className="relative shrink-0 rounded-lg border border-dashed border-emerald-300 bg-gradient-to-b from-emerald-50 to-emerald-100/70 px-3 py-2 shadow-[0_1px_2px_rgba(16,185,129,0.12)]">
                {/* The notches are the card's own white punched over the
                    border, which is what makes the edge read as torn. */}
                <span
                  aria-hidden="true"
                  className="absolute -left-[6px] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white"
                />
                <span
                  aria-hidden="true"
                  className="absolute -right-[6px] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white"
                />
                <p className="whitespace-nowrap text-[17px] font-bold leading-none text-emerald-700">
                  ₹{Number(feeAmount).toLocaleString('en-IN')}
                  <span className="text-[12px] font-semibold text-emerald-600/70">/{feeUnit}</span>
                </p>
              </div>
            )}
          </div>

          {/* ── Facts ─────────────────────────────────────────────────── */}
          {/* Inside the name's column, not under the portrait: everything the
              card says about this lawyer lines up on one left edge, and the
              photograph is a photograph rather than the start of a hanging
              indent nothing else respects. */}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[12.5px] text-slate-600">
            <Fact icon={MapPin} tone="text-primary">
              {city}
              {state ? `, ${state}` : ''}
            </Fact>
            <span className="text-slate-200" aria-hidden="true">·</span>
            <Fact icon={CalendarDays} tone="text-[#B08D2A]">{experienceLabel}</Fact>
            {languageLabel && (
              <>
                <span className="text-slate-200" aria-hidden="true">·</span>
                <Fact icon={Languages} tone="text-emerald-600">{languageLabel}</Fact>
              </>
            )}
          </div>

        </div>
      </div>

      {/* ── Expertise ─────────────────────────────────────────────────── */}
      {/* Full width under the portrait, not beside the name. In that column
          there was room for two before they wrapped, which cost the card a
          whole row to show one more. */}
      {/* Tags on the left, the way in on the right. "View Profile" is a cue,
          not a control — the whole card already opens the profile — so it is
          plain text with no face of its own, and it moves with the card's own
          hover rather than owning one. */}
      <div className="mb-1.5 mt-3.5 flex items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-slate-50 px-2.5 py-1 text-[12px] font-semibold text-slate-700 ring-1 ring-inset ring-slate-200"
            >
              {tag}
            </span>
          ))}
          {extraTags > 0 && (
            <span className="rounded-full bg-primary/[0.08] px-2.5 py-1 text-[12px] font-semibold text-primary">
              +{extraTags}
            </span>
          )}
        </div>

        {/* Still no face of its own — the card is the button. Text and arrow
            both carry the site's own blue, the one every link on the site
            already uses, so this reads as a link rather than as a third
            colour competing with the rate beside it. */}
        <span
          aria-hidden="true"
          className="inline-flex shrink-0 items-center gap-1.5 text-[12px] font-bold text-primary underline-offset-4 transition-colors duration-200 group-hover:text-primary-dark group-hover:underline"
        >
          View Profile
          <span className="grid h-5 w-5 place-items-center rounded-full bg-primary/10 text-primary transition-transform duration-200 group-hover:translate-x-0.5">
            <ArrowRight className="h-3 w-3" />
          </span>
        </span>
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
          chatRate={chatRate}
          videoRate={videoRate}
          audioRate={audioRate}
        />
      </div>
    </article>
  );
}
