import Image from 'next/image';
import { ShieldCheck, BadgeCheck, Lock } from 'lucide-react';
import Container from '@/components/ui/Container';
import SearchBar from './SearchBar';
import { CATEGORIES } from '@/data/categories';
import { cityServicePath } from '@/lib/serviceRoutes';

const TRUST = [
  { icon: ShieldCheck, label: '100% Anonymous' },
  { icon: BadgeCheck, label: 'Verified Lawyers' },
  { icon: Lock, label: 'Secure & Confidential' },
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
  const popular = CATEGORIES.slice(0, 5);
  const chipHref = (c) => (city ? cityServicePath(c, city) : `/${c.slug}`);

  // The chip that used to sit above the title was also what pushed the heading
  // clear of the header — with it gone, the section's top padding carries that
  // job on its own.
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
    <section className="relative flex items-start overflow-hidden bg-[#0F172A] pb-10 pt-20 sm:items-center sm:pb-16 sm:pt-28 md:min-h-[34rem] md:pb-16 md:pt-28 lg:min-h-[38rem]">
      {/* The banner. On a phone it is `contain`ed and pinned to the top so the
          whole photograph is visible: the artwork is 1376×768, and behind a
          390px screen `cover` had to scale it until only a narrow vertical
          slice showed, with no subject left in frame.

          From `sm` there is width enough for `cover` to crop sensibly, so it
          fills the band as before. */}
      <Image
        src="/banner-n.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="pointer-events-none object-contain object-top brightness-[0.88] sm:object-cover sm:object-center"
      />
      {/* Navy overlay, weighted to the left where the text sits. Light enough
          now that the photograph reads as a photograph, but the left third
          stays dark enough to keep white type legible over it. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0F172A]/75 via-[#0F172A]/40 to-[#0F172A]/15" />
      {/* A phone has no left third to hide the type in — the copy runs the full
          width — so it gets a vertical wash as well, and this also fades the
          contained picture's lower edge into the navy below it. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0F172A]/25 via-[#0F172A]/50 to-[#0F172A] sm:hidden" />

      <Container className="relative z-10">
        <div className="flex max-w-3xl flex-col items-start text-left">
          {/* The heading and lead sit on the picture; the search box must clear
              it, rather than straddling its lower edge.

              The contained banner is exactly `100vw ÷ (1376/768)` tall — 55.81vw
              — and the section's own `pt-20` (5rem) already eats into that. So
              this block is held to whatever height is left, and the search block
              after it therefore starts at the picture's bottom edge on any
              screen width, without a hard pixel figure to go stale. */}
          <div className="flex min-h-[calc(55.81vw-5rem)] flex-col justify-start sm:min-h-0">
          <h1 className="font-display text-[1.4rem] sm:text-[2.3rem] lg:text-[2.9rem] font-extrabold tracking-tight leading-[1.12] text-white drop-shadow-lg">
            {city ? (
              <>
                <span className="sm:whitespace-nowrap">Get Anonymous Legal Help </span>{' '}
                <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#E7C766] to-[#D4AF37]">
                  in {city.name}
                </span>
              </>
            ) : (
              <>
                <span className="sm:whitespace-nowrap">Get Anonymous Legal Help </span>{' '}
                <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#E7C766] to-[#D4AF37]">
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
            className="animate-fade-up mt-2 max-w-xl text-[12.5px] font-normal leading-[1.5] text-slate-200 drop-shadow sm:text-base sm:leading-relaxed"
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
              className="animate-fade-up mt-3 max-w-2xl text-[13px] sm:text-[15px] text-slate-300/90 leading-relaxed drop-shadow"
              style={{ animationDelay: '0.12s' }}
            >
              {intro}
            </p>
          )}
          </div>

          {/* Search Bar — begins where the picture ends, never across its edge */}
          <div className="animate-fade-up w-full max-w-2xl sm:mt-5" style={{ animationDelay: '0.15s' }}>
            {/* The glass frame is a desktop flourish. On a phone it drew a
                second outline a few pixels outside the white card's own, which
                read as a rendering fault and cost height the hero cannot spare. */}
            <div className="sm:rounded-2xl sm:border sm:border-white/15 sm:bg-white/5 sm:p-1 sm:shadow-2xl sm:backdrop-blur-md">
              <SearchBar />
            </div>

            {/* Popular Specializations Tags — one scrolling line on a phone,
                where five wrapping chips took three rows of the hero. */}
            <div className="mt-3 flex flex-nowrap items-center gap-2 overflow-x-auto text-xs [scrollbar-width:none] sm:mt-4 sm:flex-wrap sm:text-sm [&::-webkit-scrollbar]:hidden">
              <span className="font-semibold text-[#D4AF37]/90 tracking-wide uppercase text-[11px]">Popular:</span>
              {popular.length > 0 ? (
                popular.map((c) => (
                  <a
                    key={c.slug}
                    href={chipHref(c)}
                    className="shrink-0 whitespace-nowrap rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-slate-100 font-medium backdrop-blur-sm transition-all hover:bg-white/10 hover:border-[#D4AF37]/60 hover:text-white shadow-sm"
                  >
                    {c.name}
                  </a>
                ))
              ) : (
                ['Civil Law', 'Criminal Law', 'Family Law', 'Property Law', 'Corporate Law'].map((name) => (
                  <span key={name} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-slate-100 font-medium shadow-sm">
                    {name}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Trust strip — reassurance cues, spaced clear of the search block.
              Left off a phone: three chips wrapping onto two rows pushed the
              search box and everything below it down a screen, for reassurance
              the visitor has not yet asked for. */}
          <div className="animate-fade-up mt-4 hidden flex-wrap items-center gap-x-6 gap-y-3 sm:mt-6 sm:flex" style={{ animationDelay: '0.2s' }}>
            {TRUST.map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-2 text-sm font-medium text-slate-200">
                <Icon className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
