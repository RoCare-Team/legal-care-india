'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  KeyRound, Loader2, Check, AlertTriangle, Eye, EyeOff, ShieldCheck, Webhook,
} from 'lucide-react';
import { formatDate } from '@/utils/formatters';

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
        <span>
          Webhook URL for the Razorpay dashboard:{' '}
          <code className="rounded bg-ink/5 px-1.5 py-0.5 font-mono text-ink/70">
            https://your-domain.com/api/wallet/webhook
          </code>
        </span>
      </p>
    </section>
  );
}
