'use client';

import Link from 'next/link';
import { Zap, Moon, Loader2 } from 'lucide-react';
import { useAvailability } from '@/hooks/useAvailability';

/**
 * "You are Live!" when the lawyer is online; when they are not, the same band
 * says so and offers the switch — the most common reason for a quiet day.
 *
 * @param {object} props
 * @param {boolean} props.initialAvailable
 */
export default function LiveStatusBanner({ initialAvailable }) {
  const { available, saving, setAvailable } = useAvailability(initialAvailable);

  return (
    <div
      className={`flex items-center gap-4 rounded-2xl border px-4 py-3.5 sm:px-5 ${
        available ? 'border-emerald-500/25 bg-emerald-50/80' : 'border-amber-400/30 bg-amber-50/80'
      }`}
    >
      <span
        className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-full text-white ${
          available ? 'bg-emerald-600' : 'bg-amber-500'
        }`}
      >
        {available && <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/30" />}
        {available ? (
          <Zap className="relative h-5 w-5 fill-white" aria-hidden="true" />
        ) : (
          <Moon className="h-5 w-5" aria-hidden="true" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className={`font-display text-lg font-semibold ${available ? 'text-emerald-800' : 'text-amber-900'}`}>
          {available ? 'You are Live!' : 'You are Offline'}
        </p>
        <p className="text-sm text-ink/65">
          {available
            ? 'Clients can now chat, call or video call you.'
            : 'Clients can’t book you right now. Go online to start receiving requests.'}
        </p>
        {/* This switch is still entirely manual — the schedule set here only
            tells clients when to expect you, it never flips this on its own. */}
        <Link
          href="/dashboard/profile#availability"
          className={`mt-1 inline-block text-[12.5px] font-medium underline-offset-2 hover:underline ${
            available ? 'text-emerald-800/60' : 'text-amber-900/60'
          }`}
        >
          Set your usual online hours
        </Link>
      </div>

      <button
        type="button"
        onClick={() => setAvailable(!available)}
        disabled={saving}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
          available
            ? 'text-emerald-800/70 hover:bg-emerald-100 hover:text-emerald-900'
            : 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
        }`}
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {available ? 'Go offline' : 'Go online'}
      </button>
    </div>
  );
}
