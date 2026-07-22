'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Clock, Phone, Video, X } from 'lucide-react';
import useVideoCall from '@/hooks/useVideoCall';
import VideoCallOverlay from './VideoCallOverlay';

/** MM:SS from milliseconds. */
function fmt(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = String(Math.floor(total / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
}

/**
 * ChatPanel — the shared live chat used by both the user and the lawyer once
 * a consultation connects. A live countdown to `session.endsAt` sits in the
 * header; when it hits zero (or the status leaves 'active') the input locks.
 *
 * The video call lives here too, so both sides of the app get it from the one
 * place: the client rings from the header button, the lawyer's copy of this
 * panel picks the ring up off the ordinary chat poll. The call is bounded by
 * the same countdown — it costs nothing extra and dies when the session does.
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
 */
export default function ChatPanel({
  session, viewerRole, onSend, onEnd, otherName, onCallActiveChange,
}) {
  const [text, setText] = useState('');
  const [remaining, setRemaining] = useState(session.remainingMs ?? 0);
  // Optimistic messages: rendered instantly on send, dropped once the server
  // echoes them back — so the chat feels immediate instead of waiting on a poll.
  const [pending, setPending] = useState([]);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [callMinimized, setCallMinimized] = useState(false);
  const scrollRef = useRef(null);

  const active = session.status === 'active' && remaining > 0;

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

  // Local 1s countdown while the session is active. Once it ends (time up or a
  // hang-up), freeze the timer instead of letting it keep ticking.
  useEffect(() => {
    if (!session.endsAt) return undefined;
    const end = new Date(session.endsAt).getTime();
    setRemaining(Math.max(0, end - Date.now()));
    if (session.status !== 'active') return undefined; // frozen when not active
    const t = setInterval(() => setRemaining(Math.max(0, end - Date.now())), 1000);
    return () => clearInterval(t);
  }, [session.endsAt, session.status]);

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

  return (
    // Fills the modal on phones (full-screen), fixed height on larger screens.
    <div className="relative flex h-full min-h-0 flex-1 flex-col sm:h-[28rem] sm:flex-none">
      {/* Confirm before ending the consultation. */}
      {confirmEnd && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-ink/40 p-4">
          <div className="w-full max-w-xs rounded-2xl bg-surface p-5 text-center shadow-card-hover">
            <p className="font-display text-base font-semibold text-ink">End consultation?</p>
            <p className="mt-1 text-sm text-ink/55">This will end the live chat for both of you.</p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmEnd(false)}
                className="flex-1 rounded-xl border border-ink/15 py-2.5 text-sm font-semibold text-ink/70 transition-colors hover:bg-ink/5"
              >
                No
              </button>
              <button
                type="button"
                onClick={() => { setConfirmEnd(false); onEnd(); }}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
              >
                Yes, end
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header: who + countdown + end */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-ink/8 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{otherName}</p>
          <p className="text-xs text-emerald-600">● Connected</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Only the client rings — the lawyer accepts, same as the booking. */}
          {call.canStart && (
            <button
              type="button"
              onClick={call.start}
              disabled={call.busy}
              title="Start video call"
              aria-label="Start video call"
              className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
            >
              <Video className="h-4 w-4" />
            </button>
          )}
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
              remaining <= 60000 ? 'bg-red-500/10 text-red-600' : 'bg-primary/10 text-primary'
            }`}
          >
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {fmt(remaining)}
          </span>
          {active && (
            <button
              type="button"
              onClick={() => setConfirmEnd(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-red-700"
              title="End consultation"
            >
              <Phone className="h-4 w-4" />
              End
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-muted/30 p-4">
        {allMessages.length === 0 ? (
          <p className="mt-6 text-center text-sm text-ink/45">
            You&apos;re connected — say hello to start the conversation.
          </p>
        ) : (
          allMessages.map((m) => {
            const mine = m.from === viewerRole;
            const optimistic = typeof m.id === 'string' && m.id.startsWith('tmp-');
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                    mine
                      ? 'rounded-br-sm bg-primary text-white'
                      : 'rounded-bl-sm bg-surface text-ink shadow-sm ring-1 ring-ink/5'
                  } ${optimistic ? 'opacity-70' : ''}`}
                >
                  {m.text}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input / ended banner */}
      {active ? (
        <form onSubmit={submit} className="flex shrink-0 items-center gap-2 border-t border-ink/8 p-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 rounded-xl border border-ink/12 px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-primary"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-white transition-colors hover:bg-primary-dark disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      ) : (
        <div className="shrink-0 border-t border-ink/8 bg-muted/40 px-4 py-3.5 text-center">
          <p className="text-sm font-medium text-ink/70">Consultation ended</p>
          <p className="text-xs text-ink/45">The time for this session is over.</p>
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
        minimized={callMinimized}
        onMinimize={() => setCallMinimized(true)}
      />

      {/* Tucked-away call — tap to come back to it. */}
      {callLive && callMinimized && (
        <button
          type="button"
          onClick={() => setCallMinimized(false)}
          className="absolute left-1/2 top-3 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-emerald-600 py-1.5 pl-2.5 pr-4 text-white shadow-card-hover"
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
