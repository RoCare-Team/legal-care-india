'use client';

import { useEffect, useRef, useState } from 'react';
import { PhoneCall, Clock, Wallet, Check, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSessionPoll } from '@/hooks/useSessionPoll';
import { playIncomingChime } from '@/utils/beep';
import ConsultationModal from './ConsultationModal';
import ChatPanel from './ChatPanel';
import MinimizedCallBar from './MinimizedCallBar';

/**
 * AdvocateCallListener — mounted globally; only active for a signed-in advocate.
 * Polls the advocate's inbox, rings on a new incoming request, and drives the
 * accept/reject + live-chat flow. Charges happen server-side on accept.
 */
export default function AdvocateCallListener() {
  const { role } = useAuth();
  const [incoming, setIncoming] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [minimized, setMinimized] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [note, setNote] = useState('');
  const chimed = useRef(new Set());
  const dismissed = useRef(new Set());

  const isAdvocate = role === 'advocate';

  // Poll the inbox for pending/active sessions.
  useEffect(() => {
    if (!isAdvocate) return undefined;
    let alive = true;
    const tick = async () => {
      try {
        const res = await fetch('/api/consultations', { cache: 'no-store' });
        if (!res.ok) return;
        const { sessions = [] } = await res.json();
        if (!alive) return;

        const act = sessions.find((s) => s.status === 'active');
        if (act) setActiveId((cur) => cur || act.id);

        // Show an incoming request only when not already in a live chat.
        const pend = sessions.find((s) => s.status === 'pending' && !dismissed.current.has(s.id));
        if (pend && !act) {
          if (!chimed.current.has(pend.id)) {
            playIncomingChime();
            chimed.current.add(pend.id);
          }
          setIncoming(pend);
        } else {
          setIncoming(null);
        }
      } catch {
        /* ignore transient poll errors */
      }
    };
    tick();
    const t = setInterval(tick, 3000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [isAdvocate]);

  // Live chat session once accepted.
  const [activeSession, , refresh] = useSessionPoll(activeId, {
    enabled: isAdvocate && Boolean(activeId),
    interval: 2000,
  });

  // When the session ends (time up or either side hangs up), close the chat.
  useEffect(() => {
    if (activeSession?.status === 'ended') {
      setMinimized(false); // surface the "ended" state instead of staying tucked away
      const t = setTimeout(() => setActiveId(null), 1200);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [activeSession?.status]);

  if (!isAdvocate) return null;

  const accept = async (id) => {
    setAccepting(true);
    setNote('');
    try {
      const res = await fetch(`/api/consultations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveId(id);
        setMinimized(false);
        setIncoming(null);
      } else if (res.status === 402) {
        setNote('The client no longer has enough wallet balance.');
        dismissed.current.add(id);
      } else if (res.status === 409) {
        dismissed.current.add(id);
        setIncoming(null);
      } else {
        setNote(data.error || 'Could not accept.');
      }
    } catch {
      setNote('Something went wrong.');
    } finally {
      setAccepting(false);
    }
  };

  const reject = async (id) => {
    dismissed.current.add(id);
    setIncoming(null);
    await fetch(`/api/consultations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject' }),
    }).catch(() => {});
  };

  const sendMessage = async (text) => {
    if (!activeId) return;
    const res = await fetch(`/api/consultations/${activeId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (res.ok) refresh();
  };

  const endNow = async () => {
    if (!activeId) return;
    await fetch(`/api/consultations/${activeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'end' }),
    }).catch(() => {});
    refresh();
  };

  // ── Live chat (after accepting) ─────────────────────────────────────────
  if (activeId && activeSession && (activeSession.status === 'active' || activeSession.status === 'ended')) {
    // The X only tucks the chat away (like backgrounding a call) — it never
    // hangs up. Ending is the red button inside ChatPanel (onEnd).
    if (minimized) {
      return (
        <MinimizedCallBar
          name={activeSession.userName}
          endsAt={activeSession.endsAt}
          onRestore={() => setMinimized(false)}
        />
      );
    }
    return (
      <ConsultationModal
        open
        onClose={() => setMinimized(true)}
        title={`Consultation · ${activeSession.userName}`}
        icon={PhoneCall}
        fullScreen
      >
        <ChatPanel
          session={activeSession}
          viewerRole="advocate"
          otherName={activeSession.userName}
          onSend={sendMessage}
          onEnd={endNow}
        />
      </ConsultationModal>
    );
  }

  // ── Incoming request ────────────────────────────────────────────────────
  if (incoming) {
    return (
      <ConsultationModal open closable={false} title="Incoming consultation" icon={PhoneCall}>
        <div className="p-5">
          <div className="flex flex-col items-center text-center">
            <span className="relative grid h-16 w-16 place-items-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
              <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-500/10 text-emerald-600">
                <PhoneCall className="h-7 w-7" />
              </span>
            </span>
            <h4 className="mt-4 font-display text-lg font-semibold text-ink">{incoming.userName}</h4>
            <p className="text-sm text-ink/55">wants a consultation</p>

            <div className="mt-4 flex items-center gap-4 rounded-xl bg-muted/50 px-4 py-3">
              <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
                <Clock className="h-4 w-4 text-primary" /> {incoming.minutes} min
              </span>
              <span className="h-4 w-px bg-ink/10" />
              <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                <Wallet className="h-4 w-4 text-emerald-600" /> ₹{incoming.price}
              </span>
            </div>
            <p className="mt-2 text-xs text-ink/45">You&apos;ll be credited ₹{incoming.price} on accept.</p>

            {note && <p className="mt-3 text-sm text-red-600">{note}</p>}

            <div className="mt-5 flex w-full gap-3">
              <button
                type="button"
                onClick={() => reject(incoming.id)}
                disabled={accepting}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-ink/15 py-2.5 text-sm font-semibold text-ink/70 transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-50"
              >
                <X className="h-4 w-4" /> Reject
              </button>
              <button
                type="button"
                onClick={() => accept(incoming.id)}
                disabled={accepting}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Accept
              </button>
            </div>
          </div>
        </div>
      </ConsultationModal>
    );
  }

  return null;
}
