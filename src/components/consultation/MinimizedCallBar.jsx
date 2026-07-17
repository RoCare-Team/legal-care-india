'use client';

import { useEffect, useState } from 'react';
import { PhoneCall } from 'lucide-react';

/** MM:SS from milliseconds. */
function fmt(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = String(Math.floor(total / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
}

/**
 * MinimizedCallBar — a small floating pill shown while a live consultation is
 * minimized. Closing the chat modal (the X) hides the chat without ending the
 * call; this bar keeps the session visible and lets the user tap back into it.
 *
 * @param {object} props
 * @param {string} props.name       the other party's name
 * @param {string} [props.endsAt]   ISO end time for the running countdown
 * @param {()=>void} props.onRestore reopen the full chat
 */
export default function MinimizedCallBar({ name, endsAt, onRestore }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!endsAt) return undefined;
    const end = new Date(endsAt).getTime();
    const tick = () => setRemaining(Math.max(0, end - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [endsAt]);

  return (
    <button
      type="button"
      onClick={onRestore}
      className="fixed bottom-4 right-4 z-[60] flex items-center gap-2.5 rounded-full bg-surface py-2.5 pl-2.5 pr-4 shadow-card-hover ring-1 ring-ink/10 transition-transform hover:-translate-y-0.5"
      title="Return to consultation"
    >
      <span className="relative grid h-9 w-9 place-items-center rounded-full bg-emerald-500/10 text-emerald-600">
        <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
        <PhoneCall className="h-4 w-4" />
      </span>
      <span className="text-left leading-tight">
        <span className="block max-w-[10rem] truncate text-sm font-semibold text-ink">
          Consultation · {name}
        </span>
        <span className="block text-xs font-medium text-emerald-600">
          {endsAt ? `${fmt(remaining)} · tap to return` : 'Tap to return'}
        </span>
      </span>
    </button>
  );
}
