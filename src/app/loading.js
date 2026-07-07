import { Scale } from 'lucide-react';

/**
 * Global route-level loading UI. Rendered by Next.js Suspense boundaries
 * while a route segment is streaming.
 */
export default function Loading() {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="relative grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Scale className="h-7 w-7 animate-pulse" aria-hidden="true" />
          <span className="absolute inset-0 animate-ping rounded-2xl border-2 border-primary/30" />
        </span>
        <p className="text-sm font-medium text-ink/60">Loading Legal Care India…</p>
      </div>
    </div>
  );
}
