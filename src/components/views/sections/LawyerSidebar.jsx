import Link from 'next/link';
import { MapPin, BadgeCheck, Briefcase, ArrowRight, UserSearch } from 'lucide-react';
import { Avatar } from '@/components/ui';
import Rating from '@/components/shared/Rating';
import CardContactActions from '@/components/cards/CardContactActions';
import PresenceIndicator from '@/components/consultation/PresenceIndicator';
import { cn } from '@/utils/cn';
import { formatExperience, pluralize } from '@/utils/formatters';
import { advocateProfilePath } from '@/utils/advocateUrl';
import { advocateRates } from '@/constants/callRates';

/**
 * The lawyer rail that sits beside a practice-area or matter page.
 *
 * The full AdvocateCard is around 380px tall — two of them overflow a viewport,
 * which is no use in a sticky column. So this renders a condensed row instead:
 * identity, rate, experience and the same Call / Chat / Video actions, in about
 * a third of the height. Anyone who wants the full, filterable grid follows
 * "View all" through to /lawyers.
 *
 * Two shapes, one component. From `lg` it is a sticky column of stacked rows
 * beside the reading content. Below that there is no column to sit in, and a
 * vertical stack of six put the lawyers below every word of the page — so it
 * becomes a horizontal rail instead, and the page places it above the copy.
 *
 * @param {object} props
 * @param {Array}  props.advocates    already filtered to this page's subject
 * @param {string} props.label        e.g. "Cyber Crime" — used in the heading
 * @param {string} props.allHref      link to the full filterable listing
 * @param {string} props.emptyMessage shown when nobody practises this yet
 * @param {number} [props.max=6]      how many to show before linking out
 * @param {string} [props.className]  applied to the <aside>; the page uses it
 *   to order the rail ahead of the content on a narrow screen.
 */
export default function LawyerSidebar({
  advocates = [],
  label,
  allHref,
  emptyMessage,
  max = 6,
  className,
}) {
  const shown = advocates.slice(0, max);
  const remaining = advocates.length - shown.length;

  return (
    <aside
      className={cn(
        'lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto lg:pr-1',
        className
      )}
    >
      <div className="rounded-3xl border border-ink/8 bg-muted/30 p-4 sm:p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-ink">
            {advocates.length > 0 ? pluralize(advocates.length, 'lawyer') : 'Lawyers'}
          </h2>
          {advocates.length > 0 && (
            <Link href={allHref} className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          )}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-ink/50">for {label}</p>

        {shown.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-ink/15 bg-surface px-4 py-8 text-center">
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-muted text-ink/30">
              <UserSearch className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-3 text-sm leading-relaxed text-ink/55">{emptyMessage}</p>
            <Link
              href={allHref}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-brand transition-colors hover:bg-primary-dark"
            >
              Browse all lawyers
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          // A swipeable rail below `lg`, a stacked column from it. The track is
          // bled out to the panel's padding and given it back as its own, with
          // `scroll-px` to match — snapping measures from the border box, so
          // without that the leading card sits flush against the panel edge.
          <ul className="-mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1 [scrollbar-width:none] sm:-mx-5 sm:scroll-px-5 sm:px-5 lg:mx-0 lg:block lg:space-y-3 lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden">
            {shown.map((advocate) => (
              <li
                key={advocate._id}
                className="w-[82%] shrink-0 snap-start sm:w-[46%] lg:w-auto"
              >
                <CompactLawyer advocate={advocate} />
              </li>
            ))}
          </ul>
        )}

        {remaining > 0 && (
          <Link
            href={allHref}
            className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-ink/12 bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-primary/30 hover:text-primary"
          >
            View all {advocates.length} lawyers
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </div>
    </aside>
  );
}

/** One condensed lawyer row inside the rail. */
function CompactLawyer({ advocate }) {
  const {
    name, photo, city, state, experience, rating, reviews, verified,
    consultationFee, contact,
  } = advocate;

  const { chat: chatRate, audio: audioRate, video: videoRate } = advocateRates(advocate);
  // The headline figure is the cheapest per-minute rate on offer — what it
  // costs to reach this lawyer — falling back to the flat office fee.
  const liveRates = [chatRate, audioRate, videoRate].filter((r) => r > 0);
  const cheapestRate = liveRates.length ? Math.min(...liveRates) : 0;

  return (
    <div className="rounded-2xl border border-ink/8 bg-surface p-3.5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-card-hover">
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <Avatar src={photo} name={name} size="md" className="rounded-xl !bg-transparent ring-1 ring-ink/10" />
          {verified && (
            <span
              className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-surface shadow"
              aria-label="Verified lawyer"
            >
              <BadgeCheck className="h-3.5 w-3.5 text-primary" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-display text-sm font-semibold leading-tight text-ink">
              {name}
            </h3>
            <span className="shrink-0 rounded-full bg-primary/[0.07] px-2 py-0.5 text-[11px] font-semibold text-primary">
              ₹{cheapestRate || consultationFee}
              <span className="font-normal text-primary/60">
                {cheapestRate ? '/min' : ''}
              </span>
            </span>
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-ink/55">
            <MapPin className="h-3 w-3 shrink-0 text-primary/70" aria-hidden="true" />
            <span className="truncate">{city}, {state}</span>
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <Rating value={rating} reviews={reviews} size="sm" />
            <span className="inline-flex items-center gap-1 text-[11px] text-ink/55">
              <Briefcase className="h-3 w-3 text-primary/70" aria-hidden="true" />
              {formatExperience(experience)}
            </span>
            <PresenceIndicator id={advocate._id} variant="profile" />
          </div>
        </div>
      </div>

      {/* The compact size — this whole card is about the height of three
          full-size buttons, so the actions have to be scaled to it. */}
      <div className="mt-2.5 grid grid-cols-3 gap-1.5 border-t border-ink/8 pt-2.5">
        <CardContactActions
          variant="compact"
          contact={contact}
          name={name}
          advocateId={advocate._id}
          chatRate={chatRate}
          videoRate={videoRate}
          audioRate={audioRate}
        />
      </div>

      <Link
        href={`/lawyers/${advocateProfilePath(advocate)}`}
        className="mt-1.5 flex h-8 items-center justify-center gap-1 rounded-lg bg-primary px-3 text-[11px] font-semibold text-white transition-colors hover:bg-primary-dark"
      >
        View Profile
        <ArrowRight className="h-3 w-3" aria-hidden="true" />
      </Link>
    </div>
  );
}
