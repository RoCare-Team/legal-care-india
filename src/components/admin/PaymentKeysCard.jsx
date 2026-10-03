'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  KeyRound, Loader2, Check, AlertTriangle, Eye, EyeOff, ShieldCheck, Webhook, IndianRupee,
} from 'lucide-react';
import { formatDate } from '@/utils/formatters';
import { loadRazorpayCheckout } from '@/utils/razorpayCheckout';

// How long to wait for Razorpay's webhook after a test before calling it
// missing. It normally lands within a few seconds of capture.
const WEBHOOK_WAIT_MS = 30_000;
const WEBHOOK_POLL_MS = 3_000;

/**
 * PaymentKeysCard — rotate the Razorpay credentials from the panel.
 *
 * Secrets are write-only here: the server reports whether one is saved, never
 * its value. So the two secret fields start empty and blank means "leave it
 * alone" — you type in them only when actually changing a key.
 *
 * @param {object} props
 * @param {object} props.config from getPaymentConfigForAdmin
 */
export default function PaymentKeysCard({ config }) {
  const router = useRouter();

  const [keyId, setKeyId] = useState(config.keyId || '');
  const [keySecret, setKeySecret] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // The webhook URL is this site's own origin — read in the browser so it is
  // right on whichever domain the panel is opened from.
  const [origin, setOrigin] = useState('');
  useEffect(() => setOrigin(window.location.origin), []);
  const webhookUrl = `${origin || 'https://justiceland.online'}/api/wallet/webhook`;

  // ₹1 end-to-end test: idle → paying → ok | failed, with a separate line for
  // whether the webhook has shown up.
  const [test, setTest] = useState({ state: 'idle', message: '', webhook: '' });
  const pollRef = useRef(null);
  useEffect(() => () => clearTimeout(pollRef.current), []);

  const waitForWebhook = (paymentId, startedAt = Date.now()) => {
    pollRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/payments/test/${encodeURIComponent(paymentId)}`);
        const data = await res.json();
        if (data.webhookSeen) {
          setTest((t) => ({ ...t, webhook: 'seen' }));
          router.refresh();
          return;
        }
      } catch {
        /* a dropped poll is retried below */
      }
      if (Date.now() - startedAt < WEBHOOK_WAIT_MS) waitForWebhook(paymentId, startedAt);
      else setTest((t) => ({ ...t, webhook: 'missing' }));
    }, WEBHOOK_POLL_MS);
  };

  const runTest = async () => {
    clearTimeout(pollRef.current);
    setTest({ state: 'paying', message: '', webhook: '' });
    const fail = (message) => setTest({ state: 'failed', message, webhook: '' });

    try {
      const res = await fetch('/api/admin/payments/test', { method: 'POST' });
      const order = await res.json();
      if (!res.ok) return fail(order.error || 'Could not open a test order.');

      if (!(await loadRazorpayCheckout())) {
        return fail('Could not load the Razorpay checkout script. Check the connection.');
      }

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: 'Justiceland',
        description: 'Admin test payment (₹1)',
        prefill: order.prefill,
        theme: { color: '#1E3A5F' },
        handler: async (response) => {
          try {
            const confirm = await fetch('/api/admin/payments/test/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });
            const result = await confirm.json();
            if (!confirm.ok) return fail(result.error || 'The payment could not be verified.');

            setTest({
              state: 'ok',
              message: `₹${result.amount} captured${result.method ? ` via ${result.method.toUpperCase()}` : ''} — ${result.paymentId}`,
              webhook: result.webhookSeen ? 'seen' : 'waiting',
            });
            router.refresh();
            if (!result.webhookSeen) waitForWebhook(result.paymentId);
          } catch {
            fail('Paid, but the server could not be reached to verify it.');
          }
        },
        modal: {
          // Closing the sheet without paying just resets the button.
          ondismiss: () =>
            setTest((t) => (t.state === 'paying' ? { state: 'idle', message: '', webhook: '' } : t)),
        },
      });
      rzp.on('payment.failed', (resp) => {
        fail(`Razorpay declined it: ${resp?.error?.description || 'payment failed'}`);
      });
      rzp.open();
    } catch {
      fail('Something went wrong starting the test payment.');
    }
  };

  const live = config.mode === 'live';
  const fromEnv = config.source === 'env';
  const unset = config.source === 'none';

  const save = async () => {
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const res = await fetch('/api/admin/payments/keys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId, keySecret, webhookSecret }),
      });
      const data = await res.json();

      if (!res.ok) {
        // Rejected before anything was written — the old keys are still live.
        setError(data.error || 'Could not save the keys.');
        return;
      }
      // Saved. A warning means only that Razorpay was unreachable for the
      // confirming check, not that the keys are wrong.
      if (data.warning) setError(data.warning);
      else setSuccess('Keys saved and verified with Razorpay.');

      setKeySecret('');
      setWebhookSecret('');
      router.refresh();
    } catch {
      setError('Could not reach the server.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-ink/8 bg-surface p-5 shadow-card sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <KeyRound className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-display text-lg font-semibold text-ink">Razorpay keys</h3>
            <p className="mt-0.5 text-sm text-ink/55">
              Change the payment account without touching the server.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              unset
                ? 'bg-amber-500/10 text-amber-700'
                : live
                  ? 'bg-emerald-500/10 text-emerald-700'
                  : 'bg-blue-500/10 text-blue-700'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {unset ? 'Not configured' : live ? 'Live mode' : 'Test mode'}
          </span>
          <span className="rounded-full bg-ink/6 px-3 py-1 text-xs font-medium text-ink/55">
            {fromEnv ? 'from .env' : unset ? '—' : 'from admin'}
          </span>
        </div>
      </div>

      {live && (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-500/10 px-3.5 py-3 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Live keys — every top-up charges a real card. A wrong key here stops all
            payments on the site, so double-check before saving.
          </span>
        </p>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink/50">Key ID</span>
          <input
            type="text"
            value={keyId}
            onChange={(e) => setKeyId(e.target.value)}
            placeholder="rzp_live_xxxxxxxxxxxx"
            spellCheck={false}
            className="mt-1.5 h-11 w-full rounded-xl border border-ink/12 px-3.5 font-mono text-sm text-ink outline-none transition-colors placeholder:font-sans placeholder:text-ink/35 focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
          <span className="mt-1 block text-xs text-ink/45">
            Razorpay Dashboard → Account &amp; Settings → API Keys.
          </span>
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink/50">Key Secret</span>
          <div className="relative mt-1.5">
            <input
              type={showSecret ? 'text' : 'password'}
              value={keySecret}
              onChange={(e) => setKeySecret(e.target.value)}
              placeholder={config.hasKeySecret ? 'Saved — type to replace' : 'Enter the key secret'}
              spellCheck={false}
              autoComplete="new-password"
              className="h-11 w-full rounded-xl border border-ink/12 pl-3.5 pr-11 font-mono text-sm text-ink outline-none transition-colors placeholder:font-sans placeholder:text-ink/35 focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
            <button
              type="button"
              onClick={() => setShowSecret((v) => !v)}
              aria-label={showSecret ? 'Hide secret' : 'Show secret'}
              className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-ink/40 hover:bg-ink/5 hover:text-ink"
            >
              {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <span className="mt-1 block text-xs text-ink/45">
            Stored encrypted. It can be replaced, never read back.
          </span>
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink/50">
            Webhook Secret
          </span>
          <input
            type="password"
            value={webhookSecret}
            onChange={(e) => setWebhookSecret(e.target.value)}
            placeholder={config.hasWebhookSecret ? 'Saved — type to replace' : 'Optional but recommended'}
            spellCheck={false}
            autoComplete="new-password"
            className="mt-1.5 h-11 w-full rounded-xl border border-ink/12 px-3.5 font-mono text-sm text-ink outline-none transition-colors placeholder:font-sans placeholder:text-ink/35 focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
          <span className="mt-1 block text-xs text-ink/45">
            Dashboard → Settings → Webhooks, event{' '}
            <code className="font-mono">payment.captured</code>.
          </span>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {saving ? 'Saving…' : 'Save keys'}
        </button>

        {config.updatedAt && (
          <span className="text-xs text-ink/45">
            Last changed {formatDate(config.updatedAt)}
            {config.updatedBy ? ` by ${config.updatedBy}` : ''}
          </span>
        )}
      </div>

      {error && (
        <p className="mt-3 flex items-start gap-2 text-sm text-red-600">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      {success && (
        <p className="mt-3 flex items-center gap-2 text-sm text-emerald-600">
          <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
          {success}
        </p>
      )}

      <p className="mt-4 flex items-start gap-2 border-t border-ink/8 pt-4 text-xs text-ink/45">
        <Webhook className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="min-w-0 break-all">
          Webhook URL for the Razorpay dashboard:{' '}
          <code className="rounded bg-ink/5 px-1.5 py-0.5 font-mono text-ink/70">{webhookUrl}</code>
          {!config.hasWebhookSecret && !fromEnv && (
            <span className="ml-1 text-amber-700">
              — no webhook secret saved, so payments from closed tabs are never recovered.
            </span>
          )}
        </span>
      </p>

      {/* ── End-to-end check ──────────────────────────────────────────── */}
      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-ink/8 pt-4">
        <button
          type="button"
          onClick={runTest}
          disabled={unset || test.state === 'paying'}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-ink/12 px-4 text-sm font-semibold text-ink/75 transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-60"
        >
          {test.state === 'paying' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <IndianRupee className="h-4 w-4" />
          )}
          Test ₹1 payment
        </button>
        <span className="text-xs text-ink/45">
          {live
            ? 'Charges ₹1 for real with the saved keys, then checks it reached this panel.'
            : 'Runs a ₹1 test-mode payment with the saved keys, then checks it reached this panel.'}
        </span>
      </div>

      {test.state === 'failed' && (
        <p className="mt-3 flex items-start gap-2 text-sm text-red-600">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {test.message}
        </p>
      )}
      {test.state === 'ok' && (
        <div className="mt-3 space-y-1.5 text-sm">
          <p className="flex items-start gap-2 text-emerald-600">
            <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="break-all">Payment verified and recorded: {test.message}</span>
          </p>
          {test.webhook === 'seen' && (
            <p className="flex items-start gap-2 text-emerald-600">
              <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Webhook received — the Razorpay dashboard is wired up correctly.
            </p>
          )}
          {test.webhook === 'waiting' && (
            <p className="flex items-center gap-2 text-ink/55">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
              Waiting for the Razorpay webhook…
            </p>
          )}
          {test.webhook === 'missing' && (
            <p className="flex items-start gap-2 text-amber-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                No webhook after 30s. In Razorpay Dashboard → Webhooks, check the URL is{' '}
                <code className="font-mono">{webhookUrl}</code>, the event{' '}
                <code className="font-mono">payment.captured</code> is ticked, and the secret
                matches the one saved here.
              </span>
            </p>
          )}
        </div>
      )}
    </section>
  );
}
