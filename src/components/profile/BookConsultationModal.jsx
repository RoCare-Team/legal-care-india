'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarCheck, Loader2, Wallet, Timer, CheckCircle2, XCircle, WifiOff, MessagesSquare } from 'lucide-react';
import ConsultationModal from '@/components/consultation/ConsultationModal';
import ChatPanel from '@/components/consultation/ChatPanel';
import { useIsOnline } from '@/components/consultation/PresenceProvider';
import MinimizedCallBar from '@/components/consultation/MinimizedCallBar';
import { useSessionPoll } from '@/hooks/useSessionPoll';
import { affordableMinutes, formatRate } from '@/constants/callRates';
import { refreshAuth } from '@/utils/authEvents';

/**
 * BookConsultationModal — the user side of the live-chat flow:
 * start → connecting (waiting for the lawyer) → chat → ended.
 *
 * There is no length to choose. The lawyer's `rate` is per minute, the chat
 * bills the minutes it actually runs, and the wallet is charged once at the
 * end — so the only thing to decide here is whether to start.
 *
 * @param {object} props
 * @param {number} props.rate  the lawyer's ₹/min for chat; 0 ⇒ not offered
 */
export default function BookConsultationModal({
  open, onClose, advocateId, advocateName, walletBalance = 0, rate = 0,
}) {
  const [sessionId, setSessionId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [insufficient, setInsufficient] = useState(false);
  const [offline, setOffline] = useState('');
  const [minimized, setMinimized] = useState(false);
  // Minimizing unmounts ChatPanel, which owns the video call — so while a call
  // is up we keep the chat on screen and let the call's own controls tuck it away.
  const [callActive, setCallActive] = useState(false);

  const [session, setSession, refresh] = useSessionPoll(sessionId, {
    enabled: open && Boolean(sessionId),
    interval: 2000,
  });

  // Reset everything when the modal closes — including the polled session, so
  // reopening always starts fresh (not on the last ended chat).
  useEffect(() => {
    if (!open) {
      setSessionId(null);
      setSession(null);
      setError('');
      setInsufficient(false);
      setOffline('');
      setCreating(false);
      setMinimized(false);
      setCallActive(false);
    }
  }, [open, setSession]);

  const status = session?.status;

  // How long this wallet can keep the chat going at the lawyer's rate. Shown
  // up front so nobody is surprised by the cut-off mid-conversation.
  const budgetMinutes = affordableMinutes(walletBalance, rate);

  // A lawyer who has switched themselves offline isn't taking chats, so say
  // that instead of offering a button they can't act on. Only before a session
  // exists — once one is under way it plays out on its own terms.
  const isOnline = useIsOnline(advocateId, true);
  const offlineNote =
    offline || (!sessionId && !isOnline ? `${advocateName} is offline right now.` : '');

  // The clock (and the meter) starts the moment the lawyer accepts — refresh
  // the navbar balance when it stops, which is when the wallet actually moves.
  useEffect(() => {
    if (status === 'ended') refreshAuth();
  }, [status]);

  // When the consultation ends (budget spent or either side hangs up), close
  // the whole modal shortly after — the chat and its timer disappear.
  useEffect(() => {
    if (status === 'ended') {
      setMinimized(false); // surface the "ended" state instead of staying tucked away
      const t = setTimeout(onClose, 2400);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [status, onClose]);

  // Don't hang on "Connecting…" forever — if the lawyer doesn't accept in
  // time (e.g. they went offline), cancel and show an offline notice.
  useEffect(() => {
    if (status !== 'pending' || !sessionId) return undefined;
    const t = setTimeout(async () => {
      await fetch(`/api/consultations/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      }).catch(() => {});
      setSessionId(null);
      setOffline(`${advocateName} didn't respond. Please try again later.`);
    }, 45000);
    return () => clearTimeout(t);
  }, [status, sessionId, advocateName]);

  const book = async () => {
    setError('');
    setInsufficient(false);
    setCreating(true);
    try {
      const res = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ advocateId, type: 'chat' }),
      });
      const data = await res.json();
      if (res.status === 409 && data.error === 'offline') {
        setOffline(data.message || `${advocateName} is offline right now.`);
        return;
      }
      if (res.status === 402) {
        setInsufficient(true);
        setError(data.message || 'Insufficient wallet balance.');
        return;
      }
      if (!res.ok) {
        setError(data.error || 'Could not start the request.');
        return;
      }
      setSessionId(data.session.id);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const cancel = async () => {
    if (sessionId) {
      await fetch(`/api/consultations/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      }).catch(() => {});
    }
    onClose();
  };

  const sendMessage = async (text) => {
    if (!sessionId) return;
    const res = await fetch(`/api/consultations/${sessionId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (res.ok) {
      const data = await res.json();
      // Optimistic-ish: adopt the server's authoritative message list.
      if (data.session) refresh();
    }
  };

  const endNow = async () => {
    if (!sessionId) return;
    await fetch(`/api/consultations/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'end' }),
    }).catch(() => {});
    refresh();
  };

  // ── Chat (connected) — full-width modal ──────────────────────────────────
  if (sessionId && session && status === 'active') {
    // The X only tucks the chat away (like backgrounding a call) — it never
    // hangs up. Ending is the red button inside ChatPanel (onEnd).
    if (open && minimized && !callActive) {
      return (
        <MinimizedCallBar
          name={advocateName}
          endsAt={session.endsAt}
          onRestore={() => setMinimized(false)}
        />
      );
    }
    return (
      <ConsultationModal
        open={open}
        onClose={() => setMinimized(true)}
        title={`Consultation · ${advocateName}`}
        icon={CalendarCheck}
        fullScreen
      >
        <ChatPanel
          session={session}
          viewerRole="user"
          otherName={advocateName}
          onSend={sendMessage}
          onEnd={endNow}
          onCallActiveChange={setCallActive}
        />
      </ConsultationModal>
    );
  }

  return (
    <ConsultationModal
      open={open}
      onClose={status === 'pending' ? cancel : onClose}
      closable={status !== 'pending'}
      title="Start Consultation"
      icon={CalendarCheck}
    >
      <div className="p-5">
        {/* Lawyer offline */}
        {offlineNote ? (
          <div className="flex flex-col items-center py-8 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-ink/5 text-ink/40">
              <WifiOff className="h-7 w-7" />
            </span>
            <h4 className="mt-4 font-display text-lg font-semibold text-ink">Lawyer is offline</h4>
            <p className="mt-1 text-sm text-ink/55">{offlineNote}</p>
            <p className="mt-1 text-xs text-ink/45">
              You can&apos;t chat with them right now. Nothing has been charged.
            </p>
            <button type="button" onClick={onClose} className="mt-6 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark">
              Close
            </button>
          </div>
        ) : status === 'pending' ? (
          <div className="flex flex-col items-center py-6 text-center">
            <span className="relative grid h-16 w-16 place-items-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
              <span className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
                <Loader2 className="h-7 w-7 animate-spin" />
              </span>
            </span>
            <h4 className="mt-5 font-display text-lg font-semibold text-ink">Connecting…</h4>
            <p className="mt-1 text-sm text-ink/55">
              Waiting for {advocateName} to accept. Billing starts only when they do.
            </p>
            <button
              type="button"
              onClick={cancel}
              className="mt-6 rounded-xl border border-ink/15 px-5 py-2 text-sm font-medium text-ink/70 transition-colors hover:border-red-300 hover:text-red-600"
            >
              Cancel
            </button>
          </div>
        ) : status === 'rejected' ? (
          <div className="flex flex-col items-center py-8 text-center">
            <XCircle className="h-12 w-12 text-red-500" />
            <h4 className="mt-4 font-display text-lg font-semibold text-ink">Request declined</h4>
            <p className="mt-1 text-sm text-ink/55">
              {advocateName} can&apos;t take your consultation right now. You were not charged.
            </p>
            <button type="button" onClick={onClose} className="mt-6 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark">
              Close
            </button>
          </div>
        ) : status === 'ended' || status === 'cancelled' ? (
          <div className="flex flex-col items-center py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            <h4 className="mt-4 font-display text-lg font-semibold text-ink">Consultation ended</h4>
            {/* The bill, itemised — this is the first moment the user sees what
                the conversation actually cost. */}
            {session?.price > 0 ? (
              <p className="mt-1 text-sm text-ink/55">
                Charged{' '}
                <strong className="font-semibold text-ink">
                  ₹{Number(session.price).toLocaleString('en-IN')}
                </strong>{' '}
                for {session.minutes} minute{session.minutes === 1 ? '' : 's'}.
              </p>
            ) : (
              <p className="mt-1 text-sm text-ink/55">Thanks for using Legal Care India.</p>
            )}
            <button type="button" onClick={onClose} className="mt-6 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark">
              Close
            </button>
          </div>
        ) : (
          // ── Start ────────────────────────────────────────────────────────
          <>
            <p className="text-sm text-ink/60">
              You&apos;ll connect over live chat once {advocateName} accepts. You pay only for the
              minutes the conversation actually runs — end it whenever you like.
            </p>

            <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/[0.04] p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-ink/60">
                  <Timer className="h-4 w-4 text-primary" /> Chat rate
                </span>
                <span className="font-display text-xl font-bold text-ink">{formatRate(rate)}</span>
              </div>
              {budgetMinutes > 0 && (
                <p className="mt-2 border-t border-primary/15 pt-2 text-xs text-ink/55">
                  Your balance covers about{' '}
                  <strong className="font-semibold text-ink/75">{budgetMinutes} minutes</strong> —
                  the chat ends on its own at that point.
                </p>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between rounded-xl bg-muted/50 px-3.5 py-2.5">
              <span className="flex items-center gap-2 text-sm text-ink/60">
                <Wallet className="h-4 w-4 text-primary" /> Wallet balance
              </span>
              <span className="text-sm font-semibold text-ink">₹{Number(walletBalance).toLocaleString('en-IN')}</span>
            </div>

            <button
              type="button"
              disabled={creating || !rate}
              onClick={book}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
            >
              {creating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Sending request…</>
              ) : (
                <><MessagesSquare className="h-4 w-4" /> Start live chat</>
              )}
            </button>

            {!rate && (
              <p className="mt-3 text-center text-sm text-ink/55">
                {advocateName} doesn&apos;t offer live chat at the moment.
              </p>
            )}

            {error && (
              <div className="mt-4 rounded-xl bg-red-500/5 px-3.5 py-2.5 text-sm text-red-600">
                {error}
                {insufficient && (
                  <Link href="/account?tab=wallet" onClick={onClose} className="mt-1 block font-semibold underline">
                    Add money to wallet →
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </ConsultationModal>
  );
}
