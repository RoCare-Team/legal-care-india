import { Scale } from 'lucide-react';

/**
 * Global route loader — the fallback Next.js shows the moment a navigation
 * starts, for any route that doesn't ship a more specific loading.js.
 *
 * Deliberately branded rather than a bare spinner: this is the first thing a
 * visitor sees after clicking, so it should look like the site, not like the
 * page broke.
 */
export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="grid min-h-[60vh] place-items-center px-6 py-20"
    >
      <div className="flex flex-col items-center text-center">
        <span className="relative grid h-16 w-16 place-items-center">
          {/* Gold ring rotating around the brand mark. */}
          <span
            className="absolute inset-0 animate-spin rounded-full border-2 border-accent/25 border-t-accent"
            style={{ animationDuration: '0.9s' }}
            aria-hidden="true"
          />
          <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-dark text-white shadow-brand">
            <Scale className="h-5 w-5" aria-hidden="true" />
          </span>
        </span>

        <p className="mt-5 font-display text-base font-semibold text-ink">Legal Care India</p>
        <p className="mt-1 text-sm text-ink/50">Loading…</p>
      </div>
    </div>
  );
}
