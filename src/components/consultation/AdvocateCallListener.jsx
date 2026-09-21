'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSessionPoll } from '@/hooks/useSessionPoll';
import { playIncomingChime } from '@/utils/beep';
import VideoCallStage from './VideoCallStage';
import AudioCallStage from './AudioCallStage';
import MinimizedCallBar from './MinimizedCallBar';
import IncomingRequestPopup from './lawyer/IncomingRequestPopup';
import LiveConsultationWindow from './lawyer/LiveConsultationWindow';
import { RESTORE_CONSULTATION_EVENT } from '@/utils/consultationEvents';

/**
 * AdvocateCallListener — mounted globally; only active for a signed-in lawyer.
 * Polls the lawyer's inbox, rings on a new incoming request, and drives the
 * accept/reject + live-chat flow. Charges happen server-side on accept.
 *
 * What it puts on screen, in order of precedence:
 *   a live video/audio consultation  → the full-screen call
 *   a live chat                      → the chat window (or its minimized dock)
 *   a new chat/video/audio request   → the ringing request popup
 */
export default function AdvocateCallListener() {
  const { role } = useAuth();
  const [incoming, setIncoming] = useState(null);
  const [queued, setQueued] = useState(0);
  const [activeId, setActiveId] = useState(null);
  const [minimized, setMinimized] = useState(false);
  // Minimizing unmounts ChatPanel, which owns the video call — so while a call
  // is up we keep the chat on screen and let the call's own controls tuck it away.
  const [callActive, setCallActive] = useState(false);
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
        const { sessions: live = [] } = await res.json();
        if (!alive) return;

        const act = live.find((s) => s.status === 'active');
        if (act) setActiveId((cur) => cur || act.id);

        // Show an incoming request only when not already in a live chat.
        const waiting = live.filter((s) => s.status === 'pending' && !dismissed.current.has(s.id));
        const pend = waiting[0];
        if (pend && !act) {
          if (!chimed.current.has(pend.id)) {
            playIncomingChime();
            chimed.current.add(pend.id);
          }
          setIncoming(pend);
          setQueued(waiting.length - 1);
        } else {
          setIncoming(null);
          setQueued(0);
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

  // Anything else on the page (the portal's live pill) can ask for the chat back.
  useEffect(() => {
    const restore = () => setMinimized(false);
    window.addEventListener(RESTORE_CONSULTATION_EVENT, restore);
    return () => window.removeEventListener(RESTORE_CONSULTATION_EVENT, restore);
  }, []);

  // Live chat session once accepted.
  const [activeSession, , refresh] = useSessionPoll(activeId, {
    enabled: isAdvocate && Boolean(activeId),
    interval: 2000,
  });

  // When the session ends (time up or either side hangs up), close the chat.
  useEffect(() => {
    if (activeSession?.status === 'ended') {
      setMinimized(false); // surface the "ended" state instead of staying tucked away
      setCallActive(false);
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
    setNote('');
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

  // ── Live video/audio call (after accepting a call-type request) ─────────
  if (
    activeId && activeSession &&
    (activeSession.type === 'video' || activeSession.type === 'audio') &&
    activeSession.status === 'active' &&
    (activeSession.remainingMs ?? 0) > 0
  ) {
    const Stage = activeSession.type === 'video' ? VideoCallStage : AudioCallStage;
    return (
      <Stage
        session={activeSession}
        viewerRole="advocate"
        otherName={activeSession.userName}
        onEnded={endNow}
      />
    );
  }

  // ── Live chat (after accepting) ─────────────────────────────────────────
  // Video/audio sessions are handled above and must NOT fall in here —
  // otherwise an ended call would drop the lawyer back into a chat window.
  if (
    activeId && activeSession &&
    activeSession.type === 'chat' &&
    (activeSession.status === 'active' || activeSession.status === 'ended')
  ) {
    // Minimizing only tucks the chat away (like backgrounding a call) — it
    // never hangs up. Ending is the red button inside the chat.
    if (minimized && !callActive) {
      return (
        <MinimizedCallBar
          name={activeSession.userName}
          endsAt={activeSession.endsAt}
          startedAt={activeSession.startedAt}
          onRestore={() => setMinimized(false)}
          onEnd={activeSession.status === 'active' ? endNow : undefined}
        />
      );
    }
    return (
      <LiveConsultationWindow
        session={activeSession}
        onSend={sendMessage}
        onEnd={endNow}
        onMinimize={() => setMinimized(true)}
        onCallActiveChange={setCallActive}
      />
    );
  }

  // ── Incoming request ────────────────────────────────────────────────────
  if (incoming) {
    return (
      <IncomingRequestPopup
        key={incoming.id}
        request={incoming}
        queued={queued}
        accepting={accepting}
        note={note}
        onAccept={() => accept(incoming.id)}
        onReject={() => reject(incoming.id)}
      />
    );
  }

  return null;
}
