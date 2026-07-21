import { Compass, Home, Search } from 'lucide-react';
import { Container, Button, Heading } from '@/components/ui';

/**
 * 404 — Not Found page. Rendered for any unmatched route.
 */
export default function NotFound() {
  return (
    <Container className="grid min-h-[70vh] place-items-center py-16">
      <div className="max-w-lg text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Compass className="h-8 w-8" aria-hidden="true" />
        </span>
        <p className="mt-6 font-display text-6xl font-semibold text-primary">404</p>
        <Heading level={1} centered size="text-2xl sm:text-3xl" className="mt-3">
          Page Not Found
        </Heading>
        <p className="mt-3 text-ink/60">
          The page you are looking for doesn&apos;t exist or may have been moved. Let&apos;s
          get you back to finding the right lawyer.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button href="/" leftIcon={<Home className="h-4 w-4" />}>
            Back to Home
          </Button>
          <Button href="/lawyers" variant="outline" leftIcon={<Search className="h-4 w-4" />}>
            Find Lawyers
          </Button>
        </div>
      </div>
    </Container>
  );
}
