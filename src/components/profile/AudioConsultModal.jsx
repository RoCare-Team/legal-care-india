'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PhoneCall, Loader2, Wallet, Clock, XCircle, WifiOff, Smartphone, RotateCcw } from 'lucide-react';
import ConsultationModal from '@/components/consultation/ConsultationModal';
import { useIsOnline } from '@/components/consultation/PresenceProvider';
import { useSessionPoll } from '@/hooks/useSessionPoll';
import { refreshAuth } from '@/utils/authEvents';

/**
 * AudioConsultModal — the user side of a paid *audio* consultation.
 *
 * Pick one of the lawyer's audio plans and the phone network takes it from
 * there: their handset rings immediately, and the client's phone rings the
 * moment they answer. There is no accept screen — a lawyer's phone ringing IS
 * the accept screen, and they need no browser open at all. So this modal's job
 * after the plan is picked is only to say the call is on its way and show how
 * much of the paid time is left.
 *
 * Priced from the lawyer's own `audioPlans` and charged in full the moment the
 * call is answered — a declined or unanswered call costs nothing. Hang up early
 * and the unused minutes come back as a free resume for 24 hours, offered at
 * the top of this modal before any new plan is.
 *
 * A lawyer who hasn't added any audio plan is shown as not offering calls,
 * rather than the Call button quietly doing nothing.
 */
/** "8 min 30 sec" · "8 min" · "45 sec" — leftover time, from whole seconds. */
function formatLeftover(seconds = 0) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  const m = Math.floor(s / 60);
  const rest = s % 60;
  if (m && rest) return `${m} min ${rest} sec`;
  if (m) return `${m} min`;
  return `${rest} sec`;
}

/** MM:SS left on the booked time, ticking locally. */
function Countdown({ endsAt }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!endsAt) return undefined;
    const end = new Date(endsAt).getTime();
    const tick = () => setRemaining(Math.max(0, end - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [endsAt]);

  if (!endsAt) return null;
  const total = Math.floor(remaining / 1000);
  return (
    <span className="font-display text-2xl font-bold tabular-nums text-ink">
      {String(Math.floor(total / 60)).padStart(2, '0')}:{String(total % 60).padStart(2, '0')}
    </span>
  );
}

export default function AudioConsultModal({
  open, onClose, advocateId, advocateName, walletBalance = 0, plans = [],
}) {
  const [sessionId, setSessionId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [insufficient, setInsufficient] = useState(false);
  const [offline, setOffline] = useState('');
  // Unused minutes from an earlier call with this lawyer, free for 24 hours.
  const [resumable, setResumable] = useState(null);

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
      setResumable(null);
    }
  }, [open, setSession]);

  // Ask for leftover phone minutes as soon as the modal opens — a client with
  // time already paid for should be offered that before being sold more.
  useEffect(() => {
    if (!open || !advocateId) return undefined;
    let cancelled = false;
    fetch(`/api/consultations/resumable?advocateId=${advocateId}&type=audio`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setResumable(d.resumable || null);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [open, advocateId]);

  const status = session?.status;

  // A lawyer who has switched themselves offline isn't taking calls at all, so
  // say that instead of showing plans they can't act on. Only before a session
  // exists — once a call is under way it plays out on its own terms.
  const isOnline = useIsOnline(advocateId, true);
  const offlineNote =
    offline || (!sessionId && !isOnline ? `${advocateName} is offline right now.` : '');

  // The wallet is charged the moment the call is answered — refresh the navbar.
  useEffect(() => {
    if (status === 'active') refreshAuth();
  }, [status]);

  // Close shortly after it ends (time up or hang-up).
  useEffect(() => {
    if (status === 'ended') {
      const t = setTimeout(onClose, 2500);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [status, onClose]);

  // Backstop only. The server settles a ringing call at 90s from Smartflo's own
  // answer status, so this just covers a poll that never got there.
  useEffect(() => {
    if (status !== 'pending' || !sessionId) return undefined;
    const t = setTimeout(async () => {
      await fetch(`/api/consultations/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      }).catch(() => {});
      setSessionId(null);
      setOffline(`${advocateName} didn't answer the call. You were not charged.`);
    }, 120000);
    return () => clearTimeout(t);
  }, [status, sessionId, advocateName]);

  /**
   * Start a call. With a plan, it is a fresh paid one; with `resumeFrom`, it is
   * the free reconnection of minutes already paid for on an earlier call.
   */
  const book = async (plan, resumeFrom) => {
    setError('');
    setInsufficient(false);
    setCreating(true);
    try {
      const res = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          resumeFrom
            ? { advocateId, resumeFrom, type: 'audio' }
            : { advocateId, minutes: plan.minutes, type: 'audio' }
        ),
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
        // Missing phone number / dialler off come back with their own wording.
        setError(data.message || data.error || 'Could not start the call.');
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

  // End the booked session early (the phone call itself is hung up on the phone).
  const endNow = async () => {
    if (!sessionId) return;
    await fetch(`/api/consultations/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'end' }),
    }).catch(() => {});
    refresh();
  };

  return (
    <ConsultationModal
      open={open}
      onClose={status === 'pending' ? cancel : onClose}
      closable={status !== 'pending'}
      title="Audio Consultation"
      icon={PhoneCall}
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
              You can&apos;t call them right now. Nothing has been charged.
            </p>
            <button type="button" onClick={onClose} className="mt-6 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark">
              Close
            </button>
          </div>
        ) : status === 'pending' ? (
          <div className="flex flex-col items-center py-6 text-center">
            <span className="relative grid h-16 w-16 place-items-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
              <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-500/10 text-emerald-600">
                <PhoneCall className="h-7 w-7" />
              </span>
            </span>
            <h4 className="mt-5 font-display text-lg font-semibold text-ink">
              Ringing {advocateName}&apos;s phone…
            </h4>
            <p className="mt-1 text-sm text-ink/55">
              The moment they pick up, your phone will ring too.{' '}
              <span className="font-medium text-ink/80">Nothing is charged until they answer.</span>
            </p>
            <button
              type="button"
              onClick={cancel}
              className="mt-6 rounded-xl border border-ink/15 px-5 py-2 text-sm font-medium text-ink/70 transition-colors hover:border-red-300 hover:text-red-600"
            >
              Cancel
            </button>
          </div>
        ) : status === 'active' ? (
          <div className="flex flex-col items-center py-6 text-center">
            <span className="relative grid h-16 w-16 place-items-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
              <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-500/10 text-emerald-600">
                <Smartphone className="h-7 w-7" />
              </span>
            </span>
            <h4 className="mt-5 font-display text-lg font-semibold text-ink">
              {advocateName} answered
            </h4>
            <p className="mt-1 text-sm text-ink/55">
              You are being connected on the phone — pick up if your handset is still ringing. End
              early and the minutes you didn&apos;t use stay yours for 24 hours.
            </p>

            <div className="mt-5 flex items-center gap-2 rounded-xl bg-muted/50 px-4 py-3">
              <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
              <Countdown endsAt={session?.endsAt} />
              <span className="text-xs text-ink/50">left</span>
            </div>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink/45">
              <Smartphone className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
              Keep your phone to hand.
            </p>

            <button
              type="button"
              onClick={endNow}
              className="mt-6 rounded-xl border border-ink/15 px-5 py-2 text-sm font-medium text-ink/70 transition-colors hover:border-red-300 hover:text-red-600"
            >
              End consultation
            </button>
          </div>
        ) : status === 'rejected' ? (
          <div className="flex flex-col items-center py-8 text-center">
            <XCircle className="h-12 w-12 text-red-500" />
            <h4 className="mt-4 font-display text-lg font-semibold text-ink">Call not answered</h4>
            <p className="mt-1 text-sm text-ink/55">
              {advocateName} declined the call or didn&apos;t pick up.{' '}
              <span className="font-medium text-ink/80">You were not charged.</span>
            </p>
            <button type="button" onClick={onClose} className="mt-6 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark">
              Close
            </button>
          </div>
        ) : status === 'ended' || status === 'cancelled' ? (
          <div className="flex flex-col items-center py-8 text-center">
            <PhoneCall className="h-12 w-12 text-emerald-500" />
            <h4 className="mt-4 font-display text-lg font-semibold text-ink">Call ended</h4>
            {(session?.remainingMs ?? 0) >= 60000 ? (
              <p className="mt-1 text-sm text-ink/55">
                You still have{' '}
                <span className="font-medium text-ink/80">
                  {formatLeftover(Math.floor((session?.remainingMs || 0) / 1000))}
                </span>{' '}
                left — call {advocateName} back free within 24 hours.
              </p>
            ) : (
              <p className="mt-1 text-sm text-ink/55">Thanks for using Legal Care India.</p>
            )}

            <button type="button" onClick={onClose} className="mt-6 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark">
              Close
            </button>
          </div>
        ) : plans.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-ink/5 text-ink/40">
              <PhoneCall className="h-7 w-7" />
            </span>
            <h4 className="mt-4 font-display text-lg font-semibold text-ink">No audio call plans</h4>
            <p className="mt-1 text-sm text-ink/55">
              {advocateName} hasn&apos;t set up audio calls yet.
            </p>
            <button type="button" onClick={onClose} className="mt-6 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark">
              Close
            </button>
          </div>
        ) : (
          // Plan selection
          <>
            {resumable && (
              <button
                type="button"
                disabled={creating}
                onClick={() => book(null, resumable.id)}
                className="mb-4 flex w-full items-center gap-3 rounded-2xl border border-accent/40 bg-accent/[0.07] p-4 text-left transition-colors hover:border-accent hover:bg-accent/[0.12] disabled:opacity-60"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/20 text-primary-dark">
                  <RotateCcw className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-ink">
                    Resume your last call — free
                  </span>
                  <span className="mt-0.5 block text-xs text-ink/55">
                    {formatLeftover(resumable.leftoverSeconds)} left · valid for 24 hours
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600">
                  ₹0
                </span>
              </button>
            )}

            <p className="text-sm text-ink/60">
              Choose how long you want to talk. We ring {advocateName} on their phone straight away,
              and your own phone rings the moment they answer. Ended early? The unused minutes stay
              yours to call back on, free, for 24 hours.
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
                    <span className="mt-1 text-xs text-ink/50">Audio consultation</span>
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
                <Loader2 className="h-4 w-4 animate-spin" /> Placing your call…
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
