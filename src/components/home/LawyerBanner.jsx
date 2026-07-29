import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Container, Button } from '@/components/ui';

/**
 * LawyerBanner — a full-bleed band under the lawyer listing.
 *
 * The artwork keeps its centre deliberately empty and scatters the portraits
 * around the edges, so the copy sits in the middle and the faces frame it. The
 * band is height-capped rather than shown at its natural 16:9: at full width
 * that would be some 800px tall and swallow the page.
 *
 * Aimed at clients. The closing CTA at the foot of the homepage speaks to
 * advocates ("Practising Law? Let Clients Find You"), so this one must not
 * repeat it.
 *
 * The space above it is a margin, not padding: the artwork runs edge to edge,
 * so padding would push the copy down inside the image instead of separating
 * the band from the cards above it.
 */
export default function LawyerBanner() {
  return (
    // Height is capped rather than left to the artwork. At its own 16:9 the
    // image ran some 760px tall on a desktop — very nearly a second full
    // screen — for a band the visitor is meant to pass through. It is centred
    // and cropped to these heights instead, which keeps the portraits ringing
    // the copy and loses only the empty space above and below them.
    //
    // Image and copy share one grid cell, so the section can still grow if the
    // copy needs more room than the picture gives it on a narrow screen,
    // instead of the text spilling out of the band.
    <section className="relative isolate mt-10 grid overflow-hidden sm:mt-14">
      <Image
        src="/image5.png"
        alt=""
        width={1858}
        height={846}
        sizes="100vw"
        className="pointer-events-none col-start-1 row-start-1 h-[22rem] w-full object-cover object-center sm:h-[25rem] lg:h-[30rem]"
      />

      {/* Brand wash over the artwork. Deliberately a tint, not the repaint this
          band carried before: the photograph keeps its own light and its blue
          circuitry, and only picks up the navy the rest of the site is built
          from. Both stops read from --color-primary-dark, so re-theming the
          site re-themes the band with it.

          Weighted to the top and bottom and left thin through the middle —
          that is where the copy sits, so it gains contrast exactly where it is
          needed without flattening the centre of the picture. */}
      <div
        className="pointer-events-none col-start-1 row-start-1 bg-gradient-to-b from-primary-dark/70 via-primary-dark/35 to-primary-dark/75"
        aria-hidden="true"
      />
      {/* A single gold breath from the top-right, the same accent the page's own
          background uses, so the band belongs to the same set. */}
      <div
        className="pointer-events-none col-start-1 row-start-1 bg-[radial-gradient(60rem_22rem_at_85%_-10%,rgb(var(--color-accent)/0.16),transparent_65%)]"
        aria-hidden="true"
      />

      <Container className="relative col-start-1 row-start-1 grid place-items-center py-12 text-center">
        {/* Wide enough for the heading to hold one line from `lg`; the
            paragraph keeps its own narrower measure below. */}
        <div className="mx-auto max-w-2xl lg:max-w-5xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
            Anonymous Consultation
          </span>

          {/* One line from `lg`, where there is width for it. The size steps
              down slightly at that breakpoint so the full sentence fits inside
              the container rather than being pushed onto a second line. Below
              `lg` it wraps, because no phone can hold this on one line. */}
          <h2 className="mt-5 font-display text-3xl font-extrabold leading-tight text-gold drop-shadow-md sm:text-4xl lg:whitespace-nowrap lg:text-[2.1rem] xl:text-[2.5rem]">
            Talk to a Verified Lawyer{' '}
            <span className="text-gold">Without Giving Your Name</span>
          </h2>

          {/* The claim is kept to what the platform actually does: anonymity is
              a switch in the client's account, and calls are bridged so neither
              side sees the other's number. Promising more than that here would
              be a promise the product does not keep. */}
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/85 drop-shadow sm:text-base">
            Turn on anonymous mode and the advocate sees your case, not your identity 
            no name, and never your phone number. Consult by chat, call or video, at the
            fee stated upfront on their profile, with no middleman in between.
          </p>

          {/* Close under the paragraph rather than a full step below it: the
              artwork's lower portraits sit at the foot of the band, and the
              buttons were landing on top of them. */}
          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:mt-6 sm:flex-row">
            <Button
              href="/lawyers"
              variant="accent"
              size="lg"
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Find a Lawyer
            </Button>
            <Button
              href="/legal-services"
              size="lg"
              className="border border-white/25 bg-white/10 text-white shadow-none backdrop-blur-sm hover:border-white/45 hover:bg-white/20"
            >
              Browse Practice Areas
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
