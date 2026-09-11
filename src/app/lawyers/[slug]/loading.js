import { Container } from '@/components/ui';
import Skeleton from '@/components/shared/Skeleton';

/**
 * Lawyer profile loading screen, shaped like the real header: portrait, name
 * and fact tiles on the left, the consultation-fees card on the right, then the
 * tab row and the first sections.
 *
 * Without it, pressing View Profile left the directory on screen with no sign
 * anything was happening until the whole profile had rendered — which on a
 * phone read as a tap that did not work, and got tapped again.
 */
export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="pb-28 lg:pb-12">
      <span className="sr-only">Loading profile…</span>

      <div className="border-b border-ink/8 bg-surface">
        <Container className="py-6 sm:py-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_430px] xl:gap-10">
            <div className="min-w-0">
              <div className="flex items-start gap-4 sm:gap-6">
                <Skeleton className="h-[112px] w-[92px] shrink-0 rounded-2xl sm:h-[160px] sm:w-[132px]" />
                <div className="min-w-0 flex-1 sm:pt-1">
                  <Skeleton className="h-7 w-[min(18rem,90%)] sm:h-9" />
                  <Skeleton className="mt-3 h-4 w-40" />
                  <Skeleton className="mt-2.5 h-4 w-[min(26rem,95%)]" />
                  <div className="mt-3 flex gap-2">
                    <Skeleton className="h-7 w-32 rounded-full" />
                    <Skeleton className="h-7 w-24 rounded-full" />
                  </div>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-[62px] rounded-xl" />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-ink/8 bg-white p-4 shadow-card sm:p-5">
              <Skeleton className="h-3.5 w-32" />
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-[66px] rounded-xl" />
                ))}
              </div>
              <Skeleton className="mt-4 h-12 rounded-xl" />
              <Skeleton className="mt-2 h-11 rounded-xl" />
              <div className="mt-2 grid grid-cols-3 gap-2">
                <Skeleton className="h-10 rounded-xl" />
                <Skeleton className="h-10 rounded-xl" />
                <Skeleton className="h-10 rounded-xl" />
              </div>
            </div>
          </div>
        </Container>
      </div>

      <div className="border-b border-ink/8 bg-surface">
        <Container className="flex gap-6 py-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-16" />
          ))}
        </Container>
      </div>

      <Container className="mt-6 grid gap-5 sm:mt-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-ink/8 bg-surface p-5 shadow-card sm:p-7">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="mt-5 h-3.5 w-full" />
              <Skeleton className="mt-2.5 h-3.5 w-[92%]" />
              <Skeleton className="mt-2.5 h-3.5 w-[80%]" />
            </div>
          ))}
        </div>
        <div className="hidden space-y-5 lg:block">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      </Container>
    </div>
  );
}
