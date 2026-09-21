'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MessagesSquare, Video, Phone, Check, X, Loader2, Clock, IndianRupee, RotateCcw, Users } from 'lucide-react';
import { playIncomingChime } from '@/utils/beep';
import { formatRate } from '@/constants/callRates';

const TYPE = {
  chat: { label: 'Chat consultation', verb: 'wants to chat with you', icon: MessagesSquare },
  video: { label: 'Video consultation', verb: 'wants a video call with you', icon: Video },
  audio: { label: 'Audio consultation', verb: 'wants to call you', icon: Phone },
};

/** "0:07" since the request arrived. */
function waited(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * IncomingRequestPopup — the lawyer's ringing screen for a new chat or video
 * request. Rings like a phone (a chime every few seconds, for the first minute)
 * until they accept or decline, and says up front what the session pays.
 *
 * @param {object} props
 * @param {object} props.request   the pending session
 * @param {number} [props.queued]  other requests waiting behind this one
 * @param {boolean} props.accepting
 * @param {string} [props.note]    why the last accept failed
 * @param {()=>void} props.onAccept
 * @param {()=>void} props.onReject
 */
export default function IncomingRequestPopup({ request, queued = 0, accepting, note, onAccept, onReject }) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Ring again every few seconds, per request, and stop after a minute so an
  // unattended tab does not chime forever.
  useEffect(() => {
    const born = Date.now();
    const t = setInterval(() => {
      if (Date.now() - born > 60000) return clearInterval(t);
      playIncomingChime();
    }, 4000);
    return () => clearInterval(t);
  }, [request.id]);

  if (!mounted) return null;

  const type = TYPE[request.type] || TYPE.chat;
  const Icon = type.icon;
  const letter = String(request.userName || 'C').trim().charAt(0).toUpperCase() || 'C';
  const since = request.createdAt ? now - new Date(request.createdAt).getTime() : 0;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-[#070D18]/70 backdrop-blur-sm" aria-hidden="true" />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="incoming-title"
        className="relative w-full overflow-hidden rounded-t-[1.75rem] bg-surface shadow-2xl sm:max-w-md sm:rounded-[1.75rem]"
      >
        {/* Ringing header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-secondary px-6 pb-8 pt-6 text-center text-white">
          <span className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/15 blur-2xl" aria-hidden="true" />
          <div className="relative flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 font-semibold">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              Incoming request
            </span>
            <span className="inline-flex items-center gap-1 tabular-nums text-white/60">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {waited(since)}
            </span>
          </div>

          <span className="relative mx-auto mt-6 grid h-24 w-24 place-items-center">
            <span className="absolute -inset-3 animate-ping rounded-full bg-emerald-400/20" />
            <span className="absolute -inset-1.5 rounded-full bg-white/10" />
            <span className="relative grid h-24 w-24 place-items-center rounded-full bg-white font-display text-4xl font-semibold text-primary">
              {letter}
            </span>
            <span className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full bg-emerald-500 text-white ring-4 ring-primary-dark">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
          </span>

          <h2 id="incoming-title" className="relative mt-5 font-display text-2xl font-semibold">
            {request.userName || 'Client'}
          </h2>
          <p className="relative mt-1 text-sm text-white/70">
            {request.isResume ? 'wants to resume their consultation' : type.verb}
          </p>
        </div>

        {/* What it is and what it pays */}
        <div className="px-6 pt-5">
          <div className="grid grid-cols-3 divide-x divide-ink/8 rounded-2xl border border-ink/8 bg-muted/40 py-3 text-center">
            <div className="px-2">
              <Icon className="mx-auto h-4 w-4 text-primary" aria-hidden="true" />
              <p className="mt-1 text-xs font-semibold text-ink">{type.label.replace(' consultation', '')}</p>
              <p className="text-[11px] text-ink/45">Type</p>
            </div>
            <div className="px-2">
              <IndianRupee className="mx-auto h-4 w-4 text-emerald-600" aria-hidden="true" />
              <p className="mt-1 text-xs font-semibold text-ink">{formatRate(request.rate) || 'Free'}</p>
              <p className="text-[11px] text-ink/45">Your rate</p>
            </div>
            <div className="px-2">
              <Clock className="mx-auto h-4 w-4 text-amber-600" aria-hidden="true" />
              <p className="mt-1 text-xs font-semibold text-ink">
                {request.maxMinutes ? `${Math.round(request.maxMinutes)} min` : '—'}
              </p>
              <p className="text-[11px] text-ink/45">Up to</p>
            </div>
          </div>

          <p className="mt-3 text-center text-xs text-ink/50">
            {request.isResume ? (
              <span className="inline-flex items-center gap-1">
                <RotateCcw className="h-3 w-3" aria-hidden="true" /> Already-paid time — no new charge.
              </span>
            ) : (
              'You are paid for every minute it runs, credited when it ends.'
            )}
          </p>

          {note && (
            <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-center text-sm text-red-700">{note}</p>
          )}
        </div>

        {/* Decline / Accept */}
        <div className="flex items-start justify-center gap-16 px-6 pb-6 pt-5 sm:pb-7">
          <button type="button" onClick={onReject} disabled={accepting} className="group flex flex-col items-center gap-2 disabled:opacity-50">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-red-600 text-white shadow-lg shadow-red-600/30 transition-transform group-hover:scale-105 group-active:scale-95">
              <X className="h-7 w-7" />
            </span>
            <span className="text-sm font-semibold text-ink/70">Decline</span>
          </button>
          <button type="button" onClick={onAccept} disabled={accepting} className="group flex flex-col items-center gap-2 disabled:opacity-50">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 transition-transform group-hover:scale-105 group-active:scale-95">
              {accepting ? <Loader2 className="h-7 w-7 animate-spin" /> : <Check className="h-7 w-7" />}
            </span>
            <span className="text-sm font-semibold text-emerald-700">Accept</span>
          </button>
        </div>

        {queued > 0 && (
          <p className="flex items-center justify-center gap-1.5 border-t border-ink/8 bg-muted/40 py-2.5 text-xs text-ink/55">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {queued} more {queued === 1 ? 'client is' : 'clients are'} waiting
          </p>
        )}
      </div>
    </div>,
    document.body
  );
}
