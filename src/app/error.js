'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Container, Button, Heading } from '@/components/ui';

/**
 * Global route error boundary. Must be a Client Component.
 *
 * @param {object} props
 * @param {Error} props.error
 * @param {() => void} props.reset  retry the failed segment
 */
export default function Error({ error, reset }) {
  useEffect(() => {
    // Hook a real logging/monitoring service here in production.
    console.error(error);
  }, [error]);

  return (
    <Container className="grid min-h-[70vh] place-items-center py-16">
      <div className="max-w-lg text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-100 text-amber-600">
          <AlertTriangle className="h-8 w-8" aria-hidden="true" />
        </span>
        <Heading level={1} centered size="text-2xl sm:text-3xl" className="mt-6">
          Something Went Wrong
        </Heading>
        <p className="mt-3 text-ink/60">
          An unexpected error occurred while loading this page. Please try again — if the
          problem persists, come back a little later.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button onClick={reset} leftIcon={<RotateCcw className="h-4 w-4" />}>
            Try Again
          </Button>
          <Button href="/" variant="outline" leftIcon={<Home className="h-4 w-4" />}>
            Back to Home
          </Button>
        </div>
      </div>
    </Container>
  );
}
