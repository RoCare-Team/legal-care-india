'use client';

import { useState } from 'react';
import { loadRazorpayCheckout } from '@/utils/razorpayCheckout';

/**
 * Buying a membership: order, checkout sheet, and the server's confirmation.
 *
 * Extracted because two places sell the same plans — the plans page, and the
 * modal that opens the moment a lawyer bumps into a limit while editing. The
 * money path is the one thing in the product that must not have two
 * implementations: a fix made in one and missed in the other is a lawyer
 * charged without being upgraded, and nobody notices until they complain.
 *
 * What is deliberately NOT here: anything about what happens afterwards. One
 * caller navigates, the other widens a form in place. That belongs to them.
 *
 * @param {(result: object, planId: string) => void} onSuccess
 *   Called with the verify endpoint's payload once the server has granted the
 *   plan — never before, and never from the browser's own say-so.
 * @returns {{buy: (planId: string) => Promise<void>, busy: string, error: string,
 *   setError: Function}} `busy` holds the plan id being bought, or ''.
 */
export function useMembershipCheckout(onSuccess) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const buy = async (planId) => {
    setBusy(planId);
    setError('');
    try {
      const res = await fetch('/api/membership/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      const order = await res.json();
      if (!res.ok) {
        setError(order.error || 'Could not start the payment.');
        setBusy('');
        return;
      }

      // Resolves a boolean, not a constructor — the script defines
      // window.Razorpay itself, and that is what checkout is opened from.
      const ready = await loadRazorpayCheckout();
      if (!ready) {
        setError('Could not load the payment window. Check your connection.');
        setBusy('');
        return;
      }

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: 'Justiceland',
        description: `${order.plan.name} — 12 months`,
        prefill: order.prefill,
        theme: { color: '#1E3A5F' },
        handler: async (response) => {
          // The plan is granted by the server after it has checked the
          // signature, the payment and the amount — never here.
          const confirm = await fetch('/api/membership/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response),
          });
          const result = await confirm.json();
          if (!confirm.ok) {
            setError(result.error || 'Payment could not be confirmed.');
            setBusy('');
            return;
          }
          setBusy('');
          onSuccess?.(result, planId);
        },
        modal: {
          // Closing the sheet is not a failure, and must not leave the card
          // spinning forever.
          ondismiss: () => setBusy(''),
        },
      });
      rzp.open();
    } catch (err) {
      console.error('membership checkout', err);
      setError('Something went wrong starting the payment.');
      setBusy('');
    }
  };

  return { buy, busy, error, setError };
}
