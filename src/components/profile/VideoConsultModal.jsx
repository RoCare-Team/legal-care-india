'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Video, Loader2, Wallet, Clock, XCircle, WifiOff } from 'lucide-react';
import ConsultationModal from '@/components/consultation/ConsultationModal';
import VideoCallStage from '@/components/consultation/VideoCallStage';
import { useSessionPoll } from '@/hooks/useSessionPoll';
import { refreshAuth } from '@/utils/authEvents';

/**
 * VideoConsultModal — the user side of a *video* consultation: pick a video
 * plan → connecting (waiting for the lawyer) → the call connects automatically
 * once they accept → ended. Priced from the lawyer's separate `videoPlans`, so
 * the wallet is charged the video rate, not the chat rate.
 */
export default function VideoConsultModal({
  open, onClose, advocateId, advocateName, walletBalance = 0, plans = [],
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

  // The wallet is charged the moment the lawyer accepts — refresh the navbar.
  useEffect(() => {
    if (status === 'active') refreshAuth();
  }, [status]);

  // Close shortly after it ends (time up or hang-up).
  useEffect(() => {
    if (status === 'ended') {
      const t = setTimeout(onClose, 1500);
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

  const book = async (plan) => {
    setError('');
    setInsufficient(false);
    setCreating(true);
    try {
      const res = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ advocateId, minutes: plan.minutes, type: 'video' }),
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
        {offline ? (
          <div className="flex flex-col items-center py-8 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-ink/5 text-ink/40">
              <WifiOff className="h-7 w-7" />
            </span>
            <h4 className="mt-4 font-display text-lg font-semibold text-ink">Lawyer unavailable</h4>
            <p className="mt-1 text-sm text-ink/55">{offline}</p>
            <p className="mt-1 text-xs text-ink/45">You were not charged.</p>
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
            <p className="mt-1 text-sm text-ink/55">Thanks for using Legal Care India.</p>
            <button type="button" onClick={onClose} className="mt-6 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark">
              Close
            </button>
          </div>
        ) : plans.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-ink/5 text-ink/40">
              <Video className="h-7 w-7" />
            </span>
            <h4 className="mt-4 font-display text-lg font-semibold text-ink">No video plans</h4>
            <p className="mt-1 text-sm text-ink/55">{advocateName} hasn&apos;t set up video calls yet.</p>
            <button type="button" onClick={onClose} className="mt-6 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark">
              Close
            </button>
          </div>
        ) : (
          // Plan selection
          <>
            <p className="text-sm text-ink/60">
              Choose a video call length. It connects automatically once {advocateName} accepts,
              and only then is your wallet charged.
            </p>

            <div className="mt-4 flex items-center justify-between rounded-xl bg-muted/50 px-3.5 py-2.5">
              <span className="flex items-center gap-2 text-sm text-ink/60">
                <Wallet className="h-4 w-4 text-primary" /> Wallet balance
              </span>
              <span className="text-sm font-semibold text-ink">₹{Number(walletBalance).toLocaleString('en-IN')}</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {plans.map((plan) => {
                const affordable = walletBalance >= plan.price;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    disabled={creating}
                    onClick={() => book(plan)}
                    className="group flex flex-col rounded-2xl border border-ink/10 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card disabled:opacity-60"
                  >
                    <span className="flex items-center gap-1.5 text-primary">
                      <Clock className="h-4 w-4" />
                      <span className="font-display text-base font-bold text-ink">{plan.label}</span>
                    </span>
                    <span className="mt-1 text-xs text-ink/50">Video consultation</span>
                    <span className="mt-3 font-display text-xl font-bold text-ink">
                      ₹{Number(plan.price).toLocaleString('en-IN')}
                    </span>
                    {!affordable && (
                      <span className="mt-1 text-[11px] font-medium text-amber-600">Add money to book</span>
                    )}
                  </button>
                );
              })}
            </div>

            {creating && (
              <p className="mt-4 flex items-center justify-center gap-2 text-sm text-ink/55">
                <Loader2 className="h-4 w-4 animate-spin" /> Sending request…
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
