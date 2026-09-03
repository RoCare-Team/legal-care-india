'use client';

import { Check, X } from 'lucide-react';
import { useIsOnline } from './PresenceProvider';

/**
 * PresenceIndicator — live online/offline badge for a lawyer. Reflects the
 * shared presence poll, so it flips the moment the lawyer toggles their
 * availability — no page refresh needed.
 *
 * Deliberately starts at Offline rather than taking a server-rendered hint.
 * The directory and profile pages are ISR-cached (an hour on /lawyers), so a
 * server-computed "online" is whatever was true when the page was cached — it
 * would show a stale green badge on every load for up to that whole hour.
 * Reading Offline for the fraction of a second before the first poll lands is
 * the honest failure: we never tell a visitor someone is reachable when they
 * may not be.
 *
 * @param {object} props
 * @param {string} props.id  lawyer _id
 * @param {'card'|'profile'|'label'|'check'|'dot'} [props.variant]
 */
export default function PresenceIndicator({ id, variant = 'card' }) {
  const online = useIsOnline(id, false);

  // A bare status dot, for pinning to the corner of a portrait. The white ring
  // is what keeps it legible over a photograph rather than only over the grey
  // placeholder — without it a green dot on a green shirt disappears.
  if (variant === 'dot') {
    return (
      <span
        title={online ? 'Online now' : 'Offline'}
        aria-label={online ? 'Online now' : 'Offline'}
        className={`block h-4 w-4 rounded-full ring-2 ring-white ${
          online ? 'bg-emerald-500' : 'bg-slate-300'
        }`}
      />
    );
  }

  // A mark for the corner of a portrait: a tick when the lawyer is reachable,
  // a cross when they are not. A bare coloured dot needs the reader to know
  // which colour means what; a tick and a cross are the same two states with
  // the answer drawn in, and they survive being seen by someone who cannot
  // tell green from grey.
  //
  // The white ring is what keeps it legible over a photograph rather than only
  // over the grey placeholder — without it a green disc on a green shirt is
  // gone.
  if (variant === 'check') {
    return (
      <span
        title={online ? 'Online now' : 'Offline'}
        aria-label={online ? 'Online now' : 'Offline'}
        className={`grid h-[18px] w-[18px] place-items-center rounded-full ring-2 ring-white ${
          online ? 'bg-emerald-500' : 'bg-slate-400'
        }`}
      >
        {online ? (
          <Check className="h-3 w-3 text-white" strokeWidth={3.5} aria-hidden="true" />
        ) : (
          <X className="h-3 w-3 text-white" strokeWidth={3.5} aria-hidden="true" />
        )}
      </span>
    );
  }

  // The dot with the word beside it, sized for a directory card. A coloured
  // dot alone asks the reader to know the convention and to be able to tell
  // green from grey; the word does not. Small enough to sit on the card's top
  // rule opposite the rate without becoming the loudest thing on it.
  if (variant === 'label') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-[3px] text-[11.5px] font-bold ${
          online
            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200'
            : 'bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200'
        }`}
      >
        <span
          className={`h-[7px] w-[7px] rounded-full ${
            online ? 'bg-emerald-500' : 'bg-slate-400'
          }`}
          aria-hidden="true"
        />
        {online ? 'Online' : 'Offline'}
      </span>
    );
  }

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
