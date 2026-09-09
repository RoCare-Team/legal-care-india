import Image from 'next/image';
import { Zap, BadgeCheck, ShieldCheck, UserRoundCheck } from 'lucide-react';
import Container from '@/components/ui/Container';
import SearchBar from './SearchBar';

/**
 * The four promises under the search bar — the objections a visitor arrives
 * with, answered where they are about to act on them.
 */
const TRUST = [
  { icon: UserRoundCheck, label: '100% Anonymous' },
  { icon: BadgeCheck, label: 'Verified Lawyers' },
  { icon: ShieldCheck, label: 'Secure & Private' },
  { icon: Zap, label: 'Instant Consultation' },
];

/**
 * Hero — the opening band, used by both the homepage and every city page.
 *
 * A city page is the same page with the city written into it, not a different
 * layout: the heading names the city, the lead paragraph is about that city,
 * and the practice-area chips point inside it. Passing no `city` gives the
 * all-India homepage exactly as before.
 *
 * @param {object} props
 * @param {object} [props.city]   { name, state, slug }
 * @param {string} [props.intro]  opening paragraph written for that city
 */
export default function Hero({ city, intro }) {
  // The band carries the promise and the one control, and stops there. The
  // practice-area chips and the trust strip that used to be crowded in under
  // the search box are now sections of their own below it
  // and AnonymousBand — where each has room to be read rather than glanced at.
  return (
    // The header is `fixed` over this band on the homepage, so the top padding
    // is what keeps the heading clear of it — not decoration. Shrinking the
    // band earlier took that padding with it and the title ran under the logo.
    //
    // Height is otherwise set by the content on a phone: a viewport-tall hero
    // meant scrolling a full screen before reaching a single lawyer. On desktop
    // it stays a tall band but no longer a full viewport — with the copy
    // centred in `min-h-screen` there was a dead stretch above the heading and
    // another below the trust strip, and the first lawyer sat off-screen.
    <section className="relative flex items-start overflow-hidden bg-[#F6F8FB] pb-8 pt-20 sm:items-center sm:pb-12 sm:pt-24 md:min-h-[26rem] md:pb-12 md:pt-24 lg:min-h-[28rem]">
      {/* The banner. On a phone it is `contain`ed and pinned to the top so the
          whole photograph is visible: the artwork is 1376×768, and behind a
          390px screen `cover` had to scale it until only a narrow vertical
          slice showed, with no subject left in frame.

          From `sm` there is width enough for `cover` to crop sensibly, so it
          fills the band as before. */}
      {/* The right half only, from sm. On a phone there is no right half to
          give it, so it sits across the top and the copy runs underneath. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[55vw] sm:inset-y-0 sm:left-[42%] sm:right-0 sm:h-auto lg:left-[46%]">
        <Image
          src="/banner-n.png"
          alt=""
          fill
          priority
          sizes="(max-width: 639px) 100vw, 58vw"
          className="object-cover object-center"
        />
        {/* Feathered into the page rather than cut against it — a hard
            vertical seam down the middle of a hero reads as a broken image.

            The stops matter: the fade is finished by 12% and the remaining
            nine tenths of the picture are untouched. Without them the
            gradient ran the full width and put a haze over the whole
            photograph, which is the thing it was there to avoid. */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#F6F8FB] from-0% to-transparent to-12%" />
        {/* A short fade at the foot on a phone, where the picture sits above
            the copy and would otherwise end on a hard horizontal line. */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#F6F8FB] to-transparent sm:hidden" />
      </div>



      <Container className="relative z-10">
        <div className="flex max-w-3xl flex-col items-start text-left sm:max-w-[52%] lg:max-w-[50%]">
          {/* The heading and lead sit on the picture; the search box must clear
              it, rather than straddling its lower edge.

              The contained banner is exactly `100vw ÷ (1376/768)` tall — 55.81vw
              — and the section's own `pt-20` (5rem) already eats into that. So
              this block is held to whatever height is left, and the search block
              after it therefore starts at the picture's bottom edge on any
              screen width, without a hard pixel figure to go stale. */}
          <div className="flex min-h-[calc(55vw-4rem)] flex-col justify-start sm:min-h-0">
          {/* Three words for what the service is, before the heading says
              what it does. They are the objections a visitor arrives with —
              will this take days, is it safe, will anyone know — answered
              before the pitch rather than after it. */}
          <p className="animate-fade-up mb-2.5 flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#9A7B1C] sm:text-[11.5px]">
            <Zap className="h-3.5 w-3.5 shrink-0 fill-accent text-accent" aria-hidden="true" />
            Fast. Secure. Confidential.
          </p>

          <h1 className="font-display text-[1.4rem] sm:text-[2.3rem] lg:text-[2.9rem] font-extrabold tracking-tight leading-[1.12] text-primary-dark">
            {city ? (
              <>
                <span className="sm:whitespace-nowrap">Get Anonymous Legal Help </span>{' '}
                <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B8912A] via-[#D4AF37] to-[#A67C1F]">
                  in {city.name}
                </span>
              </>
            ) : (
              <>
                <span className="sm:whitespace-nowrap">Get Anonymous Legal Help </span>{' '}
                <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B8912A] via-[#D4AF37] to-[#A67C1F]">
                   in Just 10 Minutes
                </span>
              </>
            )}
          </h1>

          {/* Secondary paragraph — the city's own opening line where there is
              one, so a city page says something about that city rather than
              repeating the national pitch under a changed heading.

              The closing sentence is held back on a phone. It ran the paragraph
              onto a fourth line, which pushed the last word off the bottom of
              the picture; shrinking the type to win that one line would have
              cost legibility across the whole block for the sake of one word.
              The first sentence carries the offer on its own. */}
          <p
            className="animate-fade-up mt-2 max-w-xl text-[12.5px] font-normal leading-[1.5] text-ink/70 sm:text-base sm:leading-relaxed"
            style={{ animationDelay: '0.1s' }}
          >
            {city ? (
              <>
                {`Book a verified lawyer in ${city.name}, ${city.state} within 10 minutes — 100% anonymous, private and secure.`}
                <span className="hidden sm:inline">
                  {' '}
                  Compare experience and fees, then speak to the one you choose.
                </span>
              </>
            ) : (
              <>
                Book a verified lawyer consultation within 10 minutes — 100% anonymous,
                private and secure.
                <span className="hidden sm:inline">
                  {' '}
                  Get expert legal advice without revealing your identity.
                </span>
              </>
            )}
          </p>

          {/* The written introduction to this city's legal setting — which
              court it answers to, and how matters move there. */}
          {intro && (
            <p
              className="animate-fade-up mt-3 max-w-2xl text-[13px] sm:text-[15px] text-ink/60 leading-relaxed"
              style={{ animationDelay: '0.12s' }}
            >
              {intro}
            </p>
          )}
          </div>

          {/* The search bar begins where the picture ends, never across its
              edge. It is the last thing in the band now — what used to follow
              it here has become the two sections below the hero. */}
          <div
            className="animate-fade-up w-full sm:mt-5"
            style={{ animationDelay: '0.15s' }}
          >
            {/* The frame is a desktop flourish. On a phone it drew a second
                outline a few pixels outside the white card's own, which read as
                a rendering fault and cost height the hero cannot spare. */}
            <div className="sm:rounded-2xl sm:border sm:border-ink/8 sm:bg-white sm:p-1 sm:shadow-[0_18px_50px_-20px_rgba(15,23,42,0.35)]">
              <SearchBar city={city} />
            </div>

            {/* Four promises under the box that acts on them. Hairlines
                rather than boxes: these are one claim in four parts, and four
                cards would read as four things to click. Hidden on a phone,
                where they wrap to three rows and push the fold past the
                search bar — the thing they are meant to encourage. */}
            <ul className="mt-4 hidden flex-wrap items-center gap-x-5 gap-y-2 sm:flex">
              {TRUST.map(({ icon: Icon, label }, i) => (
                <li
                  key={label}
                  className={`flex items-center gap-2 text-[12.5px] font-medium text-ink/65 ${
                    i > 0 ? 'border-l border-ink/12 pl-5' : ''
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
