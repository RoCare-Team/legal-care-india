'use client';

import { useEffect } from 'react';
import { Video, PhoneOff, Loader2 } from 'lucide-react';
import { playIncomingChime } from '@/utils/beep';

/**
 * IncomingCallCard — what the lawyer sees when a client rings them for video
 * during a live consultation. Chimes once on arrival, the same way the
 * incoming-consultation prompt does.
 */
export default function IncomingCallCard({ callerName, busy, onAccept, onReject }) {
  useEffect(() => {
    playIncomingChime();
  }, []);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-6 py-10 text-center">
      <span className="relative grid h-24 w-24 place-items-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/25" />
        <span className="grid h-24 w-24 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
          <Video className="h-10 w-10" />
        </span>
      </span>

      <div>
        <h4 className="font-display text-2xl font-semibold text-white">{callerName}</h4>
        <p className="mt-1 text-sm text-white/60">Incoming video call</p>
      </div>

      <div className="mt-2 flex items-center gap-8">
        <button
          type="button"
          onClick={onReject}
          disabled={busy}
          className="flex flex-col items-center gap-2 disabled:opacity-50"
        >
          <span className="grid h-16 w-16 place-items-center rounded-full bg-red-600 text-white transition-colors hover:bg-red-700">
            <PhoneOff className="h-6 w-6" />
          </span>
          <span className="text-xs font-medium text-white/70">Decline</span>
        </button>

        <button
          type="button"
          onClick={onAccept}
          disabled={busy}
          className="flex flex-col items-center gap-2 disabled:opacity-50"
        >
          <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-600 text-white transition-colors hover:bg-emerald-700">
            {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <Video className="h-6 w-6" />}
          </span>
          <span className="text-xs font-medium text-white/70">Accept</span>
        </button>
      </div>

      <p className="text-xs text-white/40">
        This is part of the consultation already running — no extra charge.
      </p>
    </div>
  );
}
