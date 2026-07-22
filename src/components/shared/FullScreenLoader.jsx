'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Scale } from 'lucide-react';

/**
 * FullScreenLoader — a centred, branded overlay for waits the visitor started
 * themselves (submitting a search, opening a profile).
 *
 * Rendered through a portal onto <body>. A `position: fixed` element is
 * positioned against the nearest ancestor that has a transform, filter or
 * backdrop-filter — and this gets used from inside the hero, which has both —
 * so without the portal it would centre itself inside that box instead of the
 * screen. It also swallows clicks, so a slow route can't be fired twice.
 *
 * @param {object} props
 * @param {string} [props.message]  what is being waited on
 */
export default function FullScreenLoader({ message = 'Loading…' }) {
  // Portals need a DOM; on the server there isn't one, so wait for mount.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Freeze the page behind the overlay — scrolling a screen you can't touch
    // feels broken.
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      role="status"
      aria-live="assertive"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-[#0B1220]/70 backdrop-blur-md"
    >
      <span className="relative grid h-24 w-24 place-items-center">
        {/* Outer gold arc, clockwise. */}
        <span
          className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-accent border-r-accent/40"
          style={{ animationDuration: '1.1s' }}
          aria-hidden="true"
        />
        {/* Inner arc, counter-clockwise — two speeds read as motion, one reads
            as a loop. */}
        <span
          className="absolute inset-[0.6rem] animate-spin rounded-full border-2 border-transparent border-b-white/70 border-l-white/20"
          style={{ animationDuration: '1.6s', animationDirection: 'reverse' }}
          aria-hidden="true"
        />
        {/* Brand mark, breathing gently at the centre. */}
        <span className="grid h-12 w-12 animate-pulse place-items-center rounded-full bg-gradient-to-br from-primary-light via-primary to-primary-dark text-white shadow-brand">
          <Scale className="h-6 w-6" aria-hidden="true" />
        </span>
      </span>

      <div className="px-6 text-center">
        <p className="font-display text-lg font-semibold tracking-tight text-white">{message}</p>
        <p className="mt-1 text-sm text-white/55">Just a moment…</p>
      </div>

      {/* Indeterminate bar — gives the wait a sense of progress even though we
          have no percentage to report. */}
      <span
        className="relative h-0.5 w-48 overflow-hidden rounded-full bg-white/15"
        aria-hidden="true"
      >
        <span className="absolute inset-y-0 -left-1/3 w-1/3 animate-progress-sweep rounded-full bg-accent" />
      </span>
    </div>,
    document.body
  );
}
