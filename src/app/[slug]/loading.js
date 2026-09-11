import { Container } from '@/components/ui';
import Skeleton from '@/components/shared/Skeleton';

/**
 * Loading screen for the top-level landing pages this route serves — a
 * practice area (/tax-lawyer), a city, or a practice area in a city. They share
 * a shape: the navy page banner, then reading content with the lawyers beside
 * it. Drawing that shape at once means a tap on a category shows the page
 * arriving instead of leaving the last page on screen until everything is
 * ready.
 */
export default function Loading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>

      <div className="border-b border-[#0F172A] bg-gradient-to-br from-[#1E3A5F] via-[#1E3A5F] to-[#0F172A]">
        <Container className="py-7 sm:py-9">
          <Skeleton className="h-3.5 w-48 bg-white/15" />
          <Skeleton className="mt-3 h-5 w-36 rounded-full bg-white/15" />
          <Skeleton className="mt-3 h-8 w-[min(22rem,85%)] bg-white/20 sm:h-10" />
          <Skeleton className="mt-3 h-4 w-[min(26rem,90%)] bg-white/12" />
        </Container>
      </div>

      <Container className="py-8 sm:py-10">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_26rem]">
          <div className="order-2 space-y-3 lg:order-1">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <Skeleton className="h-6 w-48" />
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className={`h-3.5 ${i % 3 === 2 ? 'w-[70%]' : 'w-full'}`} />
            ))}
          </div>
          <div className="order-1 rounded-3xl border border-ink/8 bg-muted/30 p-4 sm:p-5 lg:order-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="mt-2 h-3 w-40" />
            <div className="mt-4 rounded-2xl border border-ink/8 bg-surface p-3.5">
              <div className="flex gap-3">
                <Skeleton className="h-16 w-16 shrink-0 rounded-xl" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-2 h-3 w-24" />
                  <Skeleton className="mt-2 h-5 w-28 rounded-full" />
                </div>
              </div>
              <Skeleton className="mt-3 h-9 rounded-xl" />
              <div className="mt-3 grid grid-cols-2 gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
