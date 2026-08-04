'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Video, Loader2, Wallet, Timer, XCircle, WifiOff } from 'lucide-react';
import ConsultationModal from '@/components/consultation/ConsultationModal';
import VideoCallStage from '@/components/consultation/VideoCallStage';
import { useIsOnline } from '@/components/consultation/PresenceProvider';
import { useSessionPoll } from '@/hooks/useSessionPoll';
import { affordableMinutes, formatRate } from '@/constants/callRates';
import { refreshAuth } from '@/utils/authEvents';

/**
 * VideoConsultModal — the user side of a *video* consultation: start →
 * connecting (waiting for the lawyer) → the call connects automatically once
 * they accept → ended.
 *
 * Billed by the minute at the lawyer's own video rate, which is separate from
 * their chat rate, and settled when the call ends. Nothing is charged for a
 * call that is declined or never answered.
 *
 * @param {object} props
 * @param {number} props.rate  the lawyer's ₹/min for video; 0 ⇒ not offered
 */
export default function VideoConsultModal({
  open, onClose, advocateId, advocateName, walletBalance = 0, rate = 0,
}) {
  const [sessionId, setSessionId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [insufficient, setInsufficient] = useState(false);
  const [offline, setOffline] = useState('');

  const [session, setSession, refresh] = useSessionPoll(sessionId, {
    enabled: open && Boolean(sessionId),
    interval: 2000,
  });

  useEffect(() => {
    if (!open) {
      setSessionId(null);
      setSession(null);
      setError('');
      setInsufficient(false);
      setOffline('');
      setCreating(false);
    }
  }, [open, setSession]);

  const status = session?.status;
  const budgetMinutes = affordableMinutes(walletBalance, rate);

  // A lawyer who has switched themselves offline isn't taking video calls, so
  // say that instead of offering a button they can't act on. Only before a
  // session exists — once one is under way it plays out on its own terms.
  const isOnline = useIsOnline(advocateId, true);
  const offlineNote =
    offline || (!sessionId && !isOnline ? `${advocateName} is offline right now.` : '');

  // The wallet moves when the call ends, not when it starts — refresh then.
  useEffect(() => {
    if (status === 'ended') refreshAuth();
  }, [status]);

  // Close shortly after it ends (budget spent or hung up).
  useEffect(() => {
    if (status === 'ended') {
      const t = setTimeout(onClose, 2400);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [status, onClose]);

  // Give up on a lawyer who never answers the video request.
  useEffect(() => {
    if (status !== 'pending' || !sessionId) return undefined;
    const t = setTimeout(async () => {
      await fetch(`/api/consultations/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      }).catch(() => {});
      setSessionId(null);
      setOffline(`${advocateName} didn't answer the video call. Please try again later.`);
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
        body: JSON.stringify({ advocateId, type: 'video' }),
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
        setError(data.error || 'Could not start the video call.');
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

  // Hanging up (or the call otherwise finishing) ends the whole session.
  const onCallEnded = useCallback(async () => {
    if (!sessionId) return;
    await fetch(`/api/consultations/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'end' }),
    }).catch(() => {});
    refresh();
  }, [sessionId, refresh]);

  // ── Live video call ──────────────────────────────────────────────────────
  if (open && sessionId && session && status === 'active' && (session.remainingMs ?? 0) > 0) {
    return (
      <VideoCallStage
        session={session}
        viewerRole="user"
        otherName={advocateName}
        onEnded={onCallEnded}
      />
    );
  }

  return (
    <ConsultationModal
      open={open}
      onClose={status === 'pending' ? cancel : onClose}
      closable={status !== 'pending'}
      title="Video Consultation"
      icon={Video}
    >
      <div className="p-5">
        {offlineNote ? (
          <div className="flex flex-col items-center py-8 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-ink/5 text-ink/40">
              <WifiOff className="h-7 w-7" />
            </span>
            <h4 className="mt-4 font-display text-lg font-semibold text-ink">Lawyer is offline</h4>
            <p className="mt-1 text-sm text-ink/55">{offlineNote}</p>
            <p className="mt-1 text-xs text-ink/45">
              You can&apos;t start a video call right now. Nothing has been charged.
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
                <Video className="h-7 w-7" />
              </span>
            </span>
            <h4 className="mt-5 font-display text-lg font-semibold text-ink">Ringing {advocateName}…</h4>
            <p className="mt-1 text-sm text-ink/55">
              Your video call will connect as soon as they accept.
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
              {advocateName} can&apos;t take your video call right now. You were not charged.
            </p>
            <button type="button" onClick={onClose} className="mt-6 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark">
              Close
            </button>
          </div>
        ) : status === 'ended' || status === 'cancelled' ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Video className="h-12 w-12 text-emerald-500" />
            <h4 className="mt-4 font-display text-lg font-semibold text-ink">Video call ended</h4>
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
        ) : !rate ? (
          <div className="flex flex-col items-center py-8 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-ink/5 text-ink/40">
              <Video className="h-7 w-7" />
            </span>
            <h4 className="mt-4 font-display text-lg font-semibold text-ink">No video calls</h4>
            <p className="mt-1 text-sm text-ink/55">{advocateName} hasn&apos;t set up video calls yet.</p>
            <button type="button" onClick={onClose} className="mt-6 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark">
              Close
            </button>
          </div>
        ) : (
          // ── Start the call ───────────────────────────────────────────────
          <>
            <p className="text-sm text-ink/60">
              The call connects automatically once {advocateName} accepts. You pay only for the
              minutes it actually runs — hang up whenever you like.
            </p>

            <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/[0.04] p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-ink/60">
                  <Timer className="h-4 w-4 text-primary" /> Video rate
                </span>
                <span className="font-display text-xl font-bold text-ink">{formatRate(rate)}</span>
              </div>
              {budgetMinutes > 0 && (
                <p className="mt-2 border-t border-primary/15 pt-2 text-xs text-ink/55">
                  Your balance covers about{' '}
                  <strong className="font-semibold text-ink/75">{budgetMinutes} minutes</strong> —
                  the call ends on its own at that point.
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
              disabled={creating}
              onClick={book}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
            >
              {creating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Sending request…</>
              ) : (
                <><Video className="h-4 w-4" /> Start video call</>
              )}
            </button>

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
