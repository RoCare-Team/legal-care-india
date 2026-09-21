'use client';

import { useEffect } from 'react';
import { Video, Phone, PhoneOff, Loader2 } from 'lucide-react';
import { playIncomingChime } from '@/utils/beep';

/**
 * IncomingCallCard — what the lawyer sees when a client rings them for video
 * or audio during a live consultation. Chimes on arrival and every few
 * seconds while it rings, the way a phone does.
 */
export default function IncomingCallCard({ callerName, busy, onAccept, onReject, video = true }) {
  useEffect(() => {
    playIncomingChime();
    const t = setInterval(playIncomingChime, 3500);
    return () => clearInterval(t);
  }, []);

  const letter = String(callerName || '?').trim().charAt(0).toUpperCase() || '?';

  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-6 px-6 py-10 text-center">
      <span className="relative">
        <span className="absolute -inset-5 animate-ping rounded-full bg-emerald-500/20" />
        <span className="absolute -inset-2 rounded-full bg-emerald-500/10" />
        <span className="relative grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br from-primary-light to-primary-dark font-display text-5xl font-semibold text-white ring-4 ring-white/10">
          {letter}
        </span>
      </span>

      <div>
        <h4 className="font-display text-3xl font-semibold text-white">{callerName}</h4>
        <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-white/65">
          {video ? (
            <Video className="h-4 w-4 text-emerald-400" aria-hidden="true" />
          ) : (
            <Phone className="h-4 w-4 text-emerald-400" aria-hidden="true" />
          )}
          {video ? 'Incoming video call' : 'Incoming call'}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-14">
        <button type="button" onClick={onReject} disabled={busy} className="flex flex-col items-center gap-2 disabled:opacity-50">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-red-600 text-white shadow-lg shadow-red-900/40 transition-colors hover:bg-red-700">
            <PhoneOff className="h-6 w-6" />
          </span>
          <span className="text-xs font-medium text-white/70">Decline</span>
        </button>

        <button type="button" onClick={onAccept} disabled={busy} className="flex flex-col items-center gap-2 disabled:opacity-50">
          <span className="grid h-16 w-16 animate-bounce place-items-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-900/40 transition-colors [animation-duration:1.4s] hover:bg-emerald-600">
            {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : video ? <Video className="h-6 w-6" /> : <Phone className="h-6 w-6" />}
          </span>
          <span className="text-xs font-medium text-white/70">Accept</span>
        </button>
      </div>

      <p className="text-xs text-white/40">
        Part of the consultation already running — no extra charge.
      </p>
    </div>
  );
}
