import { ArrowRight, Scale } from 'lucide-react';
import { Container, Button } from '@/components/ui';

/**
 * CTA — closing call-to-action inviting lawyers to register on the platform.
 */
export default function CTA() {
  return (
    <section className="py-12 sm:py-16">
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-secondary via-primary-dark to-primary px-6 py-14 text-center shadow-card-hover sm:px-12">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/20 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-primary-light/25 blur-3xl"
            aria-hidden="true"
          />
          {/* Faint scales-of-justice watermark, same motif as the profile banner. */}
          <Scale
            className="pointer-events-none absolute -left-6 top-1/2 h-48 w-48 -translate-y-1/2 -rotate-12 text-white/[0.05]"
            aria-hidden="true"
          />
          <span
            className="rule-gold absolute inset-x-12 top-0 h-px opacity-80"
            aria-hidden="true"
          />

          <span className="relative inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
            For Advocates
          </span>
          <h2 className="relative mt-4 font-display text-3xl font-semibold leading-tight text-white sm:text-4xl">
            Practising Law? <span className="text-gold">Let Clients Find You.</span>
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl leading-relaxed text-white/75">
            List your practice, show your Bar Council credentials and take paid
            consultations by chat, call or video — clients come to you, and you keep
            control of your fees and your calendar.
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              href="/register"
              variant="accent"
              size="lg"
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Register Your Practice
            </Button>
            <Button
              href="/login"
              size="lg"
              className="border border-white/20 bg-white/10 text-white shadow-none hover:border-white/40 hover:bg-white/20"
            >
              Advocate Login
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
