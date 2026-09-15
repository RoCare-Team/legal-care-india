'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Maximize2, MessagesSquare, PhoneOff } from 'lucide-react';

/** MM:SS (H:MM:SS past an hour) from milliseconds. */
function fmt(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return h ? `${h}:${m}:${s}` : `${m}:${s}`;
}

/**
 * MinimizedCallBar — a floating dock shown while a live consultation is
 * minimized. Closing the chat hides it without ending the session; this keeps
 * the session in sight and one tap away.
 *
 * @param {object} props
 * @param {string} props.name        the other party's name
 * @param {string} [props.endsAt]    ISO end time — the countdown, when there is no start
 * @param {string} [props.startedAt] ISO connect time — counts up from it when given
 * @param {()=>void} props.onRestore reopen the full chat
 * @param {()=>void} [props.onEnd]   show an end button (asks first)
 */
export default function MinimizedCallBar({ name, endsAt, startedAt, onRestore, onEnd }) {
  const [now, setNow] = useState(() => Date.now());
  const pathname = usePathname() || '';

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const clock = startedAt
    ? fmt(now - new Date(startedAt).getTime())
    : endsAt
      ? `${fmt(new Date(endsAt).getTime() - now)} left`
      : '';

  // The lawyer portal pins a tab bar to the bottom of phones; sit above it.
  const lift = pathname.startsWith('/dashboard') ? 'bottom-[5.25rem] md:bottom-6' : 'bottom-4 sm:bottom-6';

  return (
    <div
      className={`fixed right-3 z-[60] flex items-center gap-2 rounded-2xl bg-primary-dark py-2 pl-2 pr-2 text-white shadow-2xl ring-1 ring-white/10 sm:right-6 ${lift}`}
    >
      <button
        type="button"
        onClick={onRestore}
        className="flex min-w-0 items-center gap-2.5 rounded-xl py-0.5 pl-0.5 pr-2 text-left transition-colors hover:bg-white/5"
        title="Return to consultation"
      >
        <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-300">
          <span className="absolute inset-0 animate-ping rounded-xl bg-emerald-400/15" />
          <MessagesSquare className="h-5 w-5" />
        </span>
        <span className="min-w-0 leading-tight">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Live
          </span>
          <span className="block max-w-[9rem] truncate text-sm font-semibold sm:max-w-[12rem]">{name}</span>
          {clock && <span className="block text-xs tabular-nums text-white/60">{clock}</span>}
        </span>
      </button>

      <button
        type="button"
        onClick={onRestore}
        aria-label="Open chat"
        title="Open chat"
        className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 transition-colors hover:bg-white/20"
      >
        <Maximize2 className="h-4 w-4" />
      </button>
      {onEnd && (
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`End the consultation with ${name}?`)) onEnd();
          }}
          aria-label="End consultation"
          title="End consultation"
          className="grid h-9 w-9 place-items-center rounded-lg bg-red-600 transition-colors hover:bg-red-700"
        >
          <PhoneOff className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
