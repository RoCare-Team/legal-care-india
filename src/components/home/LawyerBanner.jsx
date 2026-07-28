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
    <section className="relative isolate mt-10 flex min-h-[19rem] items-center overflow-hidden sm:mt-14 sm:min-h-[23rem] lg:min-h-[27rem]">
      <Image
        src="/image1.png"
        alt=""
        fill
        sizes="100vw"
        className="pointer-events-none -z-10 object-cover object-center"
      />
      {/* The middle of the artwork is pale at the top and deep blue lower down;
          this keeps the contrast behind white type even on the light part. */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[#1E3A5F]/25 via-[#1E3A5F]/35 to-[#1E3A5F]/45"
        aria-hidden="true"
      />

      <Container className="relative py-12 text-center">
        <div className="mx-auto max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
            Verified Advocates
          </span>

          <h2 className="mt-5 font-display text-3xl font-extrabold leading-tight text-white drop-shadow-md sm:text-4xl lg:text-[2.75rem]">
            The Right Lawyer for Your Matter,{' '}
            <span className="text-gold">Wherever You Are</span>
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/85 drop-shadow sm:text-base">
            Every profile carries real Bar Council credentials, honest experience and
            fees stated upfront. Compare them, then speak to the one you choose by
            chat, call or video — with no middleman in between.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
