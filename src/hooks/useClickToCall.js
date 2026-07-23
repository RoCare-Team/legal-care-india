'use client';

import { useCallback, useState } from 'react';

/**
 * useClickToCall — place a bridged phone call to a lawyer through the dialler.
 *
 * The server rings the lawyer first and joins the client once the lawyer
 * answers, so "success" here means *the lawyer's phone is ringing*, not that a
 * conversation has started. The wording in the UI has to say that, or a visitor
 * assumes nothing happened and taps Call again.
 *
 * Falls back to a plain `tel:` link whenever the dialler is switched off
 * (no token configured), so the Call button keeps working exactly as it did
 * before this feature existed rather than turning into a dead end.
 *
 * @returns {{
 *   status: 'idle'|'dialing'|'ringing'|'error',
 *   error: string,
 *   start: (advocateId: string, options?: { fallbackTel?: string }) => Promise<void>,
 *   reset: () => void,
 * }}
 */
export function useClickToCall() {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const reset = useCallback(() => {
    setStatus('idle');
    setError('');
  }, []);

  const start = useCallback(
    async (advocateId, { fallbackTel } = {}) => {
      // A second tap while the first request is in flight would place a second
      // call — the visitor's phone would ring twice and both legs get billed.
      if (status === 'dialing') return;

      setStatus('dialing');
      setError('');

      try {
        const res = await fetch('/api/call/click-to-call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ advocateId }),
        });

        // 503 means the dialler is not configured on this deployment. That is
        // an operator state, not a user error, so hand them the phone number
        // instead of an apology.
        if (res.status === 503 && fallbackTel) {
          setStatus('idle');
          window.location.href = `tel:${fallbackTel}`;
          return;
        }

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setStatus('error');
          setError(data?.error || 'Could not place the call. Please try again.');
          return;
        }

        setStatus('ringing');
      } catch {
        setStatus('error');
        setError('Network problem — please check your connection and try again.');
      }
    },
    [status]
  );

  return { status, error, start, reset };
}
