import { ArrowRight } from 'lucide-react';
import { Container, Button } from '@/components/ui';

/**
 * CTA — closing call-to-action inviting advocates to register on the platform.
 */
export default function CTA() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-secondary to-primary px-6 py-14 text-center shadow-card-hover sm:px-12">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl"
            aria-hidden="true"
          />
          <h2 className="relative font-display text-3xl font-semibold text-white sm:text-4xl">
            Are You an Advocate?
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-white/80">
            Reach thousands of clients actively searching for legal help. Create your
            verified profile and grow your practice on Legal Care India.
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              href="/register"
              variant="accent"
              size="lg"
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Register as Advocate
            </Button>
            <Button
              href="/login"
              size="lg"
              className="bg-white/10 text-white hover:bg-white/20"
            >
              Advocate Login
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
