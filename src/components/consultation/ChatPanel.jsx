'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Clock, PhoneOff } from 'lucide-react';

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
  const [sending, setSending] = useState(false);
  const [remaining, setRemaining] = useState(session.remainingMs ?? 0);
  const scrollRef = useRef(null);

  const active = session.status === 'active' && remaining > 0;

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

  // Auto-scroll to the newest message.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [session.messages?.length]);

  const submit = async (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value || sending || !active) return;
    setSending(true);
    try {
      await onSend(value);
      setText('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[28rem] flex-col">
      {/* Header: who + countdown + end */}
      <div className="flex items-center justify-between gap-3 border-b border-ink/8 px-4 py-3">
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
              onClick={onEnd}
              className="grid h-8 w-8 place-items-center rounded-lg text-red-600 transition-colors hover:bg-red-500/10"
              title="End consultation"
            >
              <PhoneOff className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-muted/30 p-4">
        {(session.messages || []).length === 0 ? (
          <p className="mt-6 text-center text-sm text-ink/45">
            You&apos;re connected — say hello to start the conversation.
          </p>
        ) : (
          session.messages.map((m) => {
            const mine = m.from === viewerRole;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                    mine
                      ? 'rounded-br-sm bg-primary text-white'
                      : 'rounded-bl-sm bg-surface text-ink shadow-sm ring-1 ring-ink/5'
                  }`}
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
        <form onSubmit={submit} className="flex items-center gap-2 border-t border-ink/8 p-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 rounded-xl border border-ink/12 px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-primary"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-white transition-colors hover:bg-primary-dark disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      ) : (
        <div className="border-t border-ink/8 bg-muted/40 px-4 py-3.5 text-center">
          <p className="text-sm font-medium text-ink/70">Consultation ended</p>
          <p className="text-xs text-ink/45">The time for this session is over.</p>
        </div>
      )}
    </div>
  );
}
