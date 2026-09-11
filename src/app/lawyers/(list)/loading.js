import { Container } from '@/components/ui';
import Skeleton from '@/components/shared/Skeleton';

/**
 * Directory loading screen. Mirrors the real page's shape — the filter column
 * on the left from `lg`, the heading and toolbar, then one lawyer per row — so
 * nothing jumps when the data lands. A visitor who just pressed Find Lawyers
 * sees that page taking shape at once, instead of the previous page sitting
 * there as if the tap had not registered.
 *
 * It used to draw a navy hero with a filter bar floating over it and a
 * three-across grid, which is what the directory looked like before the
 * sidebar; a skeleton for a layout that no longer exists makes the page jump
 * worse than no skeleton at all.
 */
export default function Loading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading lawyers…</span>

      <Container size="wide" className="pb-10 pt-4 sm:pb-12 sm:pt-5">
        <div className="lg:grid lg:grid-cols-[264px_minmax(0,1fr)] lg:items-start lg:gap-6">
          {/* Filter column */}
          <div className="hidden rounded-2xl border border-ink/8 bg-surface p-4 shadow-sm lg:block">
            <Skeleton className="h-4 w-20" />
            {Array.from({ length: 5 }).map((_, g) => (
              <div key={g} className="mt-5 border-t border-ink/8 pt-4">
                <Skeleton className="h-3.5 w-24" />
                {Array.from({ length: g === 1 ? 6 : 3 }).map((__, i) => (
                  <Skeleton key={i} className="mt-3 h-3 w-36 max-w-full" />
                ))}
              </div>
            ))}
          </div>

          <div className="min-w-0">
            <Skeleton className="h-7 w-[min(22rem,85%)] sm:h-8" />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <Skeleton className="h-4 w-44" />
              <div className="flex w-full gap-2.5 sm:w-auto">
                <Skeleton className="h-10 flex-1 rounded-xl sm:w-24 sm:flex-none lg:hidden" />
                <Skeleton className="h-10 flex-1 rounded-xl sm:w-44 sm:flex-none" />
              </div>
            </div>

            {/* List cards — shaped like AdvocateListCard. */}
            <div className="mt-6 grid gap-4 sm:gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-4 rounded-2xl border border-ink/8 bg-surface p-4 shadow-card sm:flex-row sm:items-center sm:gap-5 sm:p-5"
                >
                  <div className="flex min-w-0 flex-1 gap-3.5 sm:gap-5">
                    <Skeleton className="h-[92px] w-[76px] shrink-0 rounded-xl sm:h-[116px] sm:w-[100px] sm:rounded-2xl" />
                    <div className="min-w-0 flex-1">
                      <Skeleton className="h-4 w-40 max-w-full" />
                      <Skeleton className="mt-2.5 h-3 w-28" />
                      <Skeleton className="mt-2.5 h-3 w-24" />
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <Skeleton className="h-6 w-16 rounded-lg" />
                        <Skeleton className="h-6 w-20 rounded-lg" />
                        <Skeleton className="h-6 w-14 rounded-lg" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-t border-ink/8 pt-3.5 sm:w-[204px] sm:grid-cols-1 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                    <Skeleton className="h-12 rounded-xl" />
                    <Skeleton className="h-12 rounded-xl" />
                    <Skeleton className="h-12 rounded-xl" />
                    <Skeleton className="h-12 rounded-xl sm:hidden" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
