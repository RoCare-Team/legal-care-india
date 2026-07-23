'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { PhoneCall, PhoneOff, X, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui';

/**
 * CallStatusModal — what the visitor sees after tapping Call.
 *
 * The lawyer's phone rings first, and the visitor's own phone only rings once
 * the lawyer answers. Nothing on screen would explain that gap, so the success
 * state has to: keep your phone to hand, it will ring shortly. Without that
 * line people assume the call failed and tap again.
 *
 * @param {object} props
 * @param {'idle'|'dialing'|'ringing'|'error'} props.status
 * @param {string} [props.error]
 * @param {string} [props.advocateName]
 * @param {() => void} props.onClose
 */
export default function CallStatusModal({ status, error, advocateName, onClose }) {
  const open = status === 'dialing' || status === 'ringing' || status === 'error';

  // Portalled to <body>, which only exists on the client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);

    // Lock scrolling, replacing the scrollbar's width with padding so the page
    // behind doesn't jump.
    const { body } = document;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;
    body.style.overflow = 'hidden';
    if (gap > 0) body.style.paddingRight = `${gap}px`;

    return () => {
      document.removeEventListener('keydown', onKey);
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const dialing = status === 'dialing';
  const ringing = status === 'ringing';
  const who = advocateName || 'the lawyer';

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="call-status-title"
    >
      <div className="absolute inset-0 bg-ink/60" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-sm rounded-2xl border border-ink/10 bg-surface p-7 text-center shadow-card-hover">
        {/* No dismiss control while the request is in flight — closing does not
            cancel the call, so offering the X there would be a lie. */}
        {!dialing && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-ink/50 hover:bg-ink/5 hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        <span
          className={`mx-auto grid h-14 w-14 place-items-center rounded-full ${
            status === 'error' ? 'bg-red-500/10 text-red-600' : 'bg-primary/10 text-primary'
          }`}
        >
          {status === 'error' ? (
            <PhoneOff className="h-7 w-7" aria-hidden="true" />
          ) : (
            <PhoneCall
              className={`h-7 w-7 ${ringing ? 'animate-pulse' : ''}`}
              aria-hidden="true"
            />
          )}
        </span>

        <h2 id="call-status-title" className="mt-4 font-display text-lg font-semibold text-ink">
          {dialing && 'Connecting…'}
          {ringing && `Ringing ${who}`}
          {status === 'error' && 'Call could not be placed'}
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-ink/60" aria-live="polite">
          {dialing && `Setting up your call with ${who}.`}
          {ringing && (
            <>
              We are calling {who} now. The moment they answer,{' '}
              <span className="font-medium text-ink/80">your phone will ring</span> — pick up and
              you will be connected.
            </>
          )}
          {status === 'error' && error}
        </p>

        {ringing && (
          <p className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-primary/[0.06] px-3 py-2 text-xs text-ink/60">
            <Smartphone className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
            Keep your phone to hand.
          </p>
        )}

        {!dialing && (
          <Button
            type="button"
            onClick={onClose}
            variant={status === 'error' ? 'primary' : 'outline'}
            fullWidth
            className="mt-5"
          >
            {status === 'error' ? 'Close' : 'Done'}
          </Button>
        )}
      </div>
    </div>,
    document.body
  );
}
