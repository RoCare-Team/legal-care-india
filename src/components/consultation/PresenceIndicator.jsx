'use client';

import { useIsOnline } from './PresenceProvider';

/**
 * PresenceIndicator — live online/offline badge for a lawyer. Reflects the
 * shared presence poll, so it flips the moment the lawyer toggles their
 * availability — no page refresh needed.
 *
 * @param {object} props
 * @param {string} props.id                 lawyer _id
 * @param {boolean} [props.initialAvailable] server-rendered status (avoids flicker)
 * @param {'card'|'profile'} [props.variant]
 */
export default function PresenceIndicator({ id, initialAvailable = false, variant = 'card' }) {
  const online = useIsOnline(id, initialAvailable);

  if (variant === 'profile') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
          online ? 'bg-emerald-500/10 text-emerald-600' : 'bg-ink/5 text-ink/50'
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full ${online ? 'bg-emerald-500' : 'bg-ink/30'}`}
          aria-hidden="true"
        />
        {online ? 'Online' : 'Offline'}
      </span>
    );
  }

  // Card variant — pill on the header banner.
  return (
    <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
      <span
        className={`h-2 w-2 rounded-full ${online ? 'bg-emerald-400' : 'bg-white/50'}`}
        aria-hidden="true"
      />
      {online ? 'Online' : 'Offline'}
    </span>
  );
}
