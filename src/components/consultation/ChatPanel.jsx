'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Clock, PhoneOff, Video, X, IndianRupee, Minimize2, MessagesSquare, Lock } from 'lucide-react';
import useVideoCall from '@/hooks/useVideoCall';
import VideoCallOverlay from './VideoCallOverlay';
import { chargeForDuration } from '@/constants/callRates';
import { previewDiscount } from '@/constants/discounts';

/** MM:SS from milliseconds (HH:MM:SS once an hour is passed). */
function fmt(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return h ? `${h}:${m}:${s}` : `${m}:${s}`;
}

/** "7:04 pm" — the time of day a message was sent. */
function messageTime(at) {
  const d = at ? new Date(at) : null;
  if (!d || Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }).toLowerCase();
}

/**
 * ChatPanel — the shared live chat used by both the user and the lawyer once
 * a consultation connects.
 *
 * The header clock counts UP from the moment the session connected, not down
 * to `endsAt`. Sessions are billed by the minute, so how long this has run is
 * the number both sides care about — and next to the running total it is the
 * number that explains it. `endsAt` is still the ceiling the wallet can cover:
 * when it is reached (or the status leaves 'active') the input locks.
 *
 * The video call lives here too, so both sides of the app get it from the one
 * place: the client rings from the header button, the lawyer's copy of this
 * panel picks the ring up off the ordinary chat poll. The call is bounded by
 * the same session — it costs nothing extra and dies when the session does.
 *
 * @param {object} props
 * @param {object} props.session       serialized session (status, messages, endsAt…)
 * @param {'user'|'advocate'} props.viewerRole
 * @param {(text:string)=>Promise<void>} props.onSend
 * @param {()=>void} props.onEnd        end the session early
 * @param {string} props.otherName
 * @param {(live:boolean)=>void} [props.onCallActiveChange]
 *   Told when a video call goes up or down. The parents use it to refuse to
 *   minimize the chat mid-call — minimizing unmounts this panel, which would
 *   take the call down with it.
 * @param {()=>void} [props.onMinimize]  shows a minimize button in the header
 * @param {boolean} [props.fill=false]   take the parent's full height at every
 *   size, instead of a fixed-height card from `sm` up
 */
export default function ChatPanel({
  session, viewerRole, onSend, onEnd, otherName, onCallActiveChange, onMinimize, fill = false,
}) {
  const [text, setText] = useState('');
  const [remaining, setRemaining] = useState(session.remainingMs ?? 0);
  const [elapsed, setElapsed] = useState(0);
  // Optimistic messages: rendered instantly on send, dropped once the server
  // echoes them back — so the chat feels immediate instead of waiting on a poll.
  const [pending, setPending] = useState([]);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [callMinimized, setCallMinimized] = useState(false);
  const scrollRef = useRef(null);

  const active = session.status === 'active' && remaining > 0;

  // What the session has run up so far. Derived from the elapsed time rather
  // than polled: it has to move with the countdown to be believable, and the
  // server's figure is only final once the session ends.
  const billedSoFar = session.startedAt && session.rate
    ? chargeForDuration(Date.now() - new Date(session.startedAt).getTime(), session.rate).amount
    : 0;
  // An admin can discount a session while it is running (see
  // constants/discounts). When one is on this session the meter has to show
  // the discounted figure: it is a promise of what this conversation will
  // cost, and a number that is quietly wrong by half is worse than none.
  const runningCost = previewDiscount(billedSoFar, session.discount).collected;

  // Video call. `session.call` rides along on the chat poll, which is what
  // makes the lawyer's side ring without a second poller.
  const call = useVideoCall({
    sessionId: session.id,
    viewerRole,
    call: session.call,
    sessionActive: active,
  });

  // A finished call always comes back to the foreground, so nobody is left
  // wondering why the little "in call" pill went quiet.
  const callLive = call.phase === 'connecting' || call.phase === 'connected';
  useEffect(() => {
    if (!callLive) setCallMinimized(false);
  }, [callLive]);

  // Let the parent know, so it keeps this panel mounted for the call's sake.
  useEffect(() => {
    onCallActiveChange?.(callLive);
  }, [callLive, onCallActiveChange]);

  // Reconcile: remove each optimistic bubble once a matching server message
  // (same side + text) has arrived, consuming one server match per pending.
  useEffect(() => {
    setPending((prev) => {
      if (!prev.length) return prev;
      const pool = (session.messages || [])
        .filter((m) => m.from === viewerRole)
        .map((m) => m.text);
      const remainingPending = [];
      for (const pm of prev) {
        const idx = pool.indexOf(pm.text);
        if (idx >= 0) pool.splice(idx, 1); // confirmed by the server → drop it
        else remainingPending.push(pm);
      }
      return remainingPending.length === prev.length ? prev : remainingPending;
    });
  }, [session.messages, viewerRole]);

  // What actually renders: confirmed server messages + not-yet-confirmed ones.
  const allMessages = [...(session.messages || []), ...pending];

  // One 1s tick drives both numbers: how long this has run (shown) and how
  // much of the wallet ceiling is left (which decides when the input locks).
  // Once the session ends, freeze them instead of letting them keep moving.
  useEffect(() => {
    const end = session.endsAt ? new Date(session.endsAt).getTime() : null;
    const start = session.startedAt ? new Date(session.startedAt).getTime() : null;
    const tick = () => {
      if (end) setRemaining(Math.max(0, end - Date.now()));
      if (start) setElapsed(Math.max(0, Date.now() - start));
    };
    tick();
    if (session.status !== 'active') return undefined; // frozen when not active
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [session.endsAt, session.startedAt, session.status]);

  // Auto-scroll to the newest message (including optimistic ones).
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [allMessages.length]);

  const submit = async (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value || !active) return;
    const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    // Show it immediately and clear the input — don't wait for the network.
    setPending((p) => [...p, { id: tempId, from: viewerRole, text: value }]);
    setText('');
    try {
      await onSend(value);
    } catch {
      // Send failed — pull the optimistic bubble back out.
      setPending((p) => p.filter((m) => m.id !== tempId));
    }
  };

  const initial = String(otherName || '?').replace(/^Adv\.?\s*/i, '').trim().charAt(0).toUpperCase() || '?';
  const lowBalance = active && remaining <= 60000;

  return (
    <div
      className={`relative flex min-h-0 flex-1 flex-col bg-surface ${
        fill ? 'h-full' : 'h-full sm:h-[30rem] sm:flex-none'
      }`}
    >
      {/* Confirm before ending the consultation. */}
      {confirmEnd && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-ink/50 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-xs rounded-3xl bg-surface p-6 text-center shadow-card-hover">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-red-50 text-red-600">
              <PhoneOff className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-3 font-display text-lg font-semibold text-ink">End consultation?</p>
            <p className="mt-1 text-sm text-ink/55">
              This ends the live chat for both of you. Billing stops at {fmt(elapsed)}.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmEnd(false)}
                className="flex-1 rounded-xl border border-ink/15 py-2.5 text-sm font-semibold text-ink/70 transition-colors hover:bg-ink/5"
              >
                Keep talking
              </button>
              <button
                type="button"
                onClick={() => { setConfirmEnd(false); onEnd(); }}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
              >
                End now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header: who, live state, meters, actions */}
      <div className="flex shrink-0 items-center gap-3 border-b border-ink/8 bg-surface px-3 py-2.5 sm:px-4">
        <span className="relative shrink-0">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 font-display text-base font-semibold text-primary">
            {initial}
          </span>
          <span
            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
              active ? 'bg-emerald-500' : 'bg-ink/30'
            }`}
          />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{otherName}</p>
          <p className="flex items-center gap-1.5 text-xs">
            {active ? (
              <span className="font-medium text-emerald-600">Live chat</span>
            ) : (
              <span className="text-ink/45">Ended</span>
            )}
            <span className="text-ink/25">•</span>
            {/* How long this has run. Red in the last minute the wallet covers —
                the only time the ceiling is worth mentioning. */}
            <span
              className={`inline-flex items-center gap-1 font-semibold tabular-nums ${lowBalance ? 'text-red-600' : 'text-ink/70'}`}
              title={lowBalance ? 'Under a minute of balance left' : 'Time this consultation has run'}
            >
              <Clock className="h-3 w-3" aria-hidden="true" />
              {fmt(elapsed)}
            </span>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {/* What this conversation has come to so far. The running total is the
              whole point of per-minute billing — neither side should guess it. */}
          {session.rate > 0 && (
            <span
              className="hidden items-center gap-0.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold tabular-nums text-emerald-700 min-[380px]:inline-flex"
              title={viewerRole === 'advocate' ? 'Earned so far' : 'Cost so far'}
            >
              <IndianRupee className="h-3 w-3" aria-hidden="true" />
              {runningCost.toLocaleString('en-IN')}
              {session.discount && (
                <span className="font-medium text-emerald-700/70 line-through">
                  {billedSoFar.toLocaleString('en-IN')}
                </span>
              )}
            </span>
          )}
          {/* Why it is less than the clock suggests. */}
          {session.discount && (
            <span
              className="hidden items-center rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-700 sm:inline-flex"
              title={session.discount.note || 'Discount applied by JusticeLand'}
            >
              {session.discount.label}
            </span>
          )}
          {/* Only the client rings — the lawyer accepts, same as the booking. */}
          {call.canStart && (
            <button
              type="button"
              onClick={call.start}
              disabled={call.busy}
              title="Start video call"
              aria-label="Start video call"
              className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
            >
              <Video className="h-4 w-4" />
            </button>
          )}
          {onMinimize && (
            <button
              type="button"
              onClick={onMinimize}
              title="Minimize — the consultation keeps running"
              aria-label="Minimize chat"
              className="grid h-9 w-9 place-items-center rounded-full text-ink/55 transition-colors hover:bg-ink/5 hover:text-ink"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          )}
          {active && (
            <button
              type="button"
              onClick={() => setConfirmEnd(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-red-600 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-red-700"
              title="End consultation"
            >
              <PhoneOff className="h-4 w-4" />
              <span className="hidden sm:inline">End</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-1.5 overflow-y-auto bg-[#F4F6FA] bg-[radial-gradient(rgb(30_58_95/0.05)_1px,transparent_1px)] [background-size:18px_18px] px-3 py-4 sm:px-5"
      >
        <p className="mx-auto mb-3 flex w-fit items-center gap-1.5 rounded-full bg-surface/90 px-3 py-1 text-[11px] text-ink/50 shadow-sm">
          <Lock className="h-3 w-3" aria-hidden="true" />
          Private consultation · billed per minute
        </p>

        {allMessages.length === 0 ? (
          <div className="mt-10 flex flex-col items-center gap-2 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <MessagesSquare className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="text-sm font-medium text-ink/65">You&apos;re connected</p>
            <p className="text-xs text-ink/45">Say hello to start the conversation.</p>
          </div>
        ) : (
          allMessages.map((m, i) => {
            const mine = m.from === viewerRole;
            const optimistic = typeof m.id === 'string' && m.id.startsWith('tmp-');
            // Consecutive lines from one side sit closer, like any messenger.
            const grouped = i > 0 && allMessages[i - 1].from === m.from;
            // An optimistic message has not been stamped by the server yet;
            // showing "now" for it would be a guess, so it shows nothing until
            // the real time arrives a poll later.
            const sentAt = messageTime(m.at);
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} ${grouped ? '' : 'pt-1.5'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm sm:max-w-[70%] ${
                    mine
                      ? `bg-primary text-white ${grouped ? '' : 'rounded-br-md'}`
                      : `bg-surface text-ink ring-1 ring-ink/5 ${grouped ? '' : 'rounded-bl-md'}`
                  } ${optimistic ? 'opacity-70' : ''}`}
                >
                  <span className="whitespace-pre-wrap break-words">{m.text}</span>
                  {sentAt && (
                    <time
                      dateTime={new Date(m.at).toISOString()}
                      className={`ml-2 float-right mt-1.5 text-[10px] tabular-nums ${
                        mine ? 'text-white/60' : 'text-ink/40'
                      }`}
                    >
                      {sentAt}
                    </time>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input / ended banner */}
      {active ? (
        <form onSubmit={submit} className="flex shrink-0 items-center gap-2 border-t border-ink/8 bg-surface p-2.5 sm:p-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            aria-label="Message"
            className="h-11 flex-1 rounded-full border border-ink/10 bg-muted/60 px-4 text-sm text-ink outline-none transition-colors placeholder:text-ink/40 focus:border-primary/40 focus:bg-surface"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            aria-label="Send"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-white shadow-brand transition-colors hover:bg-primary-dark disabled:opacity-40 disabled:shadow-none"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      ) : (
        <div className="shrink-0 border-t border-ink/8 bg-muted/50 px-4 py-3.5 text-center">
          <p className="text-sm font-semibold text-ink/75">Consultation ended</p>
          <p className="text-xs text-ink/45">
            {session.rate > 0 ? `Ran ${fmt(elapsed)} · ₹${runningCost.toLocaleString('en-IN')}` : 'The time for this session is over.'}
          </p>
        </div>
      )}

      {/* Camera / mic problem — usually a denied permission prompt. */}
      {call.error && (
        <div className="absolute inset-x-3 top-3 z-30 flex items-start gap-2 rounded-xl bg-red-600 px-3.5 py-2.5 text-sm text-white shadow-card-hover">
          <span className="flex-1">{call.error}</span>
          <button
            type="button"
            onClick={call.clearError}
            aria-label="Dismiss"
            className="shrink-0 rounded-md p-0.5 transition-colors hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* The call itself. Stays mounted while minimized so the streams live on. */}
      <VideoCallOverlay
        call={call}
        otherName={otherName}
        endsAt={session.endsAt}
        startedAt={session.startedAt}
        minimized={callMinimized}
        onMinimize={() => setCallMinimized(true)}
      />

      {/* Tucked-away call — tap to come back to it. */}
      {callLive && callMinimized && (
        <button
          type="button"
          onClick={() => setCallMinimized(false)}
          className="absolute left-1/2 top-16 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-emerald-600 py-1.5 pl-2.5 pr-4 text-white shadow-card-hover"
        >
          <span className="relative grid h-6 w-6 place-items-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-white/30" />
            <Video className="h-3.5 w-3.5" />
          </span>
          <span className="text-xs font-semibold">Video call · tap to return</span>
        </button>
      )}
    </div>
  );
}
