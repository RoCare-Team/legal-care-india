'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Clock, Phone } from 'lucide-react';

/** MM:SS from milliseconds. */
function fmt(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = String(Math.floor(total / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
}

/**
 * ChatPanel — the shared live chat used by both the user and the advocate once
 * a consultation connects. A live countdown to `session.endsAt` sits in the
 * header; when it hits zero (or the status leaves 'active') the input locks.
 *
 * @param {object} props
 * @param {object} props.session       serialized session (status, messages, endsAt…)
 * @param {'user'|'advocate'} props.viewerRole
 * @param {(text:string)=>Promise<void>} props.onSend
 * @param {()=>void} props.onEnd        end the session early
 * @param {string} props.otherName
 */
export default function ChatPanel({ session, viewerRole, onSend, onEnd, otherName }) {
  const [text, setText] = useState('');
  const [remaining, setRemaining] = useState(session.remainingMs ?? 0);
  // Optimistic messages: rendered instantly on send, dropped once the server
  // echoes them back — so the chat feels immediate instead of waiting on a poll.
  const [pending, setPending] = useState([]);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const scrollRef = useRef(null);

  const active = session.status === 'active' && remaining > 0;

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
    </div>
  );
}
