'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PhoneCall, Loader2, Wallet, Timer, XCircle, WifiOff, Smartphone } from 'lucide-react';
import ConsultationModal from '@/components/consultation/ConsultationModal';
import { useIsOnline } from '@/components/consultation/PresenceProvider';
import { useSessionPoll } from '@/hooks/useSessionPoll';
import { affordableMinutes, chargeForDuration, formatRate } from '@/constants/callRates';
import { refreshAuth } from '@/utils/authEvents';

/**
 * AudioConsultModal — the user side of an audio consultation.
 *
 * Tap Call and the phone network takes it from there: the lawyer's handset
 * rings immediately, and the client's phone rings the moment they answer.
 * There is no accept screen — a lawyer's phone ringing IS the accept screen,
 * and they need no browser open at all.
 *
 * Billed by the minute at the lawyer's own audio rate, settled when the call
 * ends: a declined or unanswered call costs nothing, and one that runs three
 * minutes costs three minutes. The wallet balance sets a ceiling the call cuts
 * off at, which is what the meter below counts down against.
 *
 * A lawyer with no audio rate is shown as not offering calls, rather than the
 * Call button quietly doing nothing.
 */

/**
 * Live cost meter — what the call has run up so far, ticking every second.
 *
 * Deliberately the client's own arithmetic on `startedAt` rather than a number
 * polled from the server: it has to move every second to be reassuring, and
 * the server's figure is only authoritative once the call is over (which is
 * the number the ended screen shows).
 */
function CostMeter({ startedAt, rate }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!startedAt || !rate) return null;
  const elapsedMs = Math.max(0, now - new Date(startedAt).getTime());
  const seconds = Math.floor(elapsedMs / 1000);
  const { amount } = chargeForDuration(elapsedMs, rate);

  return (
    <div className="mt-5 flex items-center gap-4 rounded-xl bg-muted/50 px-4 py-3">
      <span className="flex items-center gap-2">
        <Timer className="h-4 w-4 text-primary" aria-hidden="true" />
        <span className="font-display text-2xl font-bold tabular-nums text-ink">
          {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}
        </span>
      </span>
      <span className="h-6 w-px bg-ink/10" aria-hidden="true" />
      <span>
        <span className="block font-display text-lg font-bold tabular-nums text-ink">
          ₹{amount.toLocaleString('en-IN')}
        </span>
        <span className="block text-[11px] text-ink/50">so far</span>
      </span>
    </div>
  );
}

export default function AudioConsultModal({
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

  // A lawyer who has switched themselves offline isn't taking calls at all, so
  // say that instead of offering a button they can't act on. Only before a
  // session exists — once a call is under way it plays out on its own terms.
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

  const book = async () => {
    setError('');
    setInsufficient(false);
    setCreating(true);
    try {
      const res = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ advocateId, type: 'audio' }),
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

  // End the session early (the phone call itself is hung up on the phone).
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
              You are being connected on the phone — pick up if your handset is still ringing.
              You&apos;re paying {formatRate(session?.rate || rate)}; hang up whenever you like.
            </p>

            <CostMeter startedAt={session?.startedAt} rate={session?.rate || rate} />

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
            {session?.price > 0 ? (
              <p className="mt-1 text-sm text-ink/55">
                Charged{' '}
                <strong className="font-semibold text-ink">
                  ₹{Number(session.price).toLocaleString('en-IN')}
                </strong>{' '}
                for {session.minutes} minute{session.minutes === 1 ? '' : 's'}.
              </p>
            ) : (
              <p className="mt-1 text-sm text-ink/55">Thanks for using Justiceland.</p>
            )}

            <button type="button" onClick={onClose} className="mt-6 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark">
              Close
            </button>
          </div>
        ) : !rate ? (
          <div className="flex flex-col items-center py-8 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-ink/5 text-ink/40">
              <PhoneCall className="h-7 w-7" />
            </span>
            <h4 className="mt-4 font-display text-lg font-semibold text-ink">No audio calls</h4>
            <p className="mt-1 text-sm text-ink/55">
              {advocateName} hasn&apos;t set up audio calls yet.
            </p>
            <button type="button" onClick={onClose} className="mt-6 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark">
              Close
            </button>
          </div>
        ) : (
          // ── Start the call ───────────────────────────────────────────────
          <>
            <p className="text-sm text-ink/60">
              We ring {advocateName} on their phone straight away, and your own phone rings the
              moment they answer. You pay only for the minutes you actually talk.
            </p>

            <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/[0.04] p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-ink/60">
                  <Timer className="h-4 w-4 text-primary" /> Call rate
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
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
            >
              {creating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Placing your call…</>
              ) : (
                <><PhoneCall className="h-4 w-4" /> Call {advocateName}</>
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
