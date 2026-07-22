import { Container } from '@/components/ui';
import Skeleton from '@/components/shared/Skeleton';

/**
 * Directory loading screen. Mirrors the real page's shape — navy hero, the
 * filter bar floating over it, then the card grid — so the layout doesn't jump
 * when the data lands. A visitor who just hit Search sees the page they asked
 * for taking shape, not a spinner in the middle of nowhere.
 */
export default function Loading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading lawyers…</span>

      {/* Hero band — same navy as PageHeader, so the swap is invisible. */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-dark via-primary to-secondary pb-24 pt-10 sm:pb-28 sm:pt-14">
        <span className="rule-gold absolute inset-x-0 bottom-0 h-px opacity-60" aria-hidden="true" />
        <Container>
          <Skeleton className="h-5 w-40 bg-white/15" />
          <Skeleton className="mt-5 h-9 w-[min(28rem,90%)] bg-white/20 sm:h-11" />
          <Skeleton className="mt-4 h-4 w-[min(34rem,95%)] bg-white/12" />
        </Container>
      </div>

      <Container className="relative z-20 -mt-12 pb-10 sm:-mt-16 sm:pb-12">
        {/* Filter bar */}
        <div className="rounded-2xl border border-ink/8 bg-surface p-4 shadow-card sm:p-5">
          <div className="mb-4 flex items-center gap-2.5 border-b border-ink/8 pb-3">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <div className="flex-1">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="mt-2 h-3 w-56 max-w-full" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-2 h-11 rounded-xl" />
              </div>
            ))}
          </div>
        </div>

        <Skeleton className="mt-6 h-4 w-32" />

        {/* Card grid — six placeholders shaped like AdvocateCard. */}
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-ink/8 bg-surface shadow-card"
            >
              <div className="h-16 bg-gradient-to-br from-primary/90 to-primary-dark" />
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-16 w-16 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="mt-2.5 h-3 w-40 max-w-full" />
                    <Skeleton className="mt-2.5 h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="mt-4 h-6 w-28 rounded-full" />
                <div className="mt-4 flex gap-3">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2 border-t border-ink/8 pt-4">
                  <Skeleton className="h-9 rounded-xl" />
                  <Skeleton className="h-9 rounded-xl" />
                  <Skeleton className="h-9 rounded-xl" />
                </div>
                <Skeleton className="mt-3 h-11 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
