import { Container } from '@/components/ui';
import Skeleton from '@/components/shared/Skeleton';

/**
 * Lawyer profile loading screen — cover banner, avatar and the two-column body,
 * so opening a profile from the directory feels like the page filling in rather
 * than a blank wait.
 */
export default function Loading() {
  return (
    <Container className="py-8" role="status" aria-live="polite">
      <span className="sr-only">Loading lawyer profile…</span>

      <div className="overflow-hidden rounded-2xl border border-ink/8 bg-surface shadow-card">
        <div className="h-36 bg-gradient-to-br from-primary via-primary-dark to-secondary sm:h-48" />
        <div className="px-5 pb-6 pt-5 sm:px-8 sm:pb-8">
          <div className="flex items-center gap-4 sm:items-end sm:gap-5">
            <Skeleton className="h-24 w-24 shrink-0 rounded-full sm:-mt-12 sm:h-28 sm:w-28" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-6 w-48 max-w-full" />
              <Skeleton className="mt-3 h-3.5 w-64 max-w-full" />
              <Skeleton className="mt-3 h-3.5 w-40" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-ink/8 bg-surface p-5 shadow-card sm:p-6">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-4 h-3 w-full" />
              <Skeleton className="mt-2.5 h-3 w-[92%]" />
              <Skeleton className="mt-2.5 h-3 w-[78%]" />
            </div>
          ))}
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-ink/8 bg-surface p-5 shadow-card">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-4 h-11 rounded-xl" />
            <Skeleton className="mt-3 h-11 rounded-xl" />
            <Skeleton className="mt-3 h-11 rounded-xl" />
          </div>
          <div className="rounded-2xl border border-ink/8 bg-surface p-5 shadow-card">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-4 h-3 w-full" />
            <Skeleton className="mt-2.5 h-3 w-[85%]" />
          </div>
        </div>
      </div>
    </Container>
  );
}
