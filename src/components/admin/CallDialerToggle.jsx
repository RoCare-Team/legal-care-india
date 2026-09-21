'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PhoneCall, Loader2, AlertTriangle } from 'lucide-react';
import { formatDate } from '@/utils/formatters';

/**
 * CallDialerToggle — the kill switch for phone calling (Tata Smartflo).
 *
 * Off by default and independent of the .env token: the token only lets
 * calling *work*, this switch decides whether it's *allowed* right now. Flip
 * it here and it takes effect without a redeploy.
 *
 * @param {object} props
 * @param {object} props.settings from getCallSettingsForAdmin
 */
export default function CallDialerToggle({ settings }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(Boolean(settings?.enabled));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggle = async () => {
    const next = !enabled;
    setError('');
    setSaving(true);
    try {
      const res = await fetch('/api/admin/calls/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not save the setting.');
        return;
      }
      setEnabled(next);
      router.refresh();
    } catch {
      setError('Could not reach the server.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mb-6 rounded-2xl border border-ink/8 bg-surface p-5 shadow-card sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <PhoneCall className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-display text-lg font-semibold text-ink">Phone dialler</h3>
            <p className="mt-0.5 text-sm text-ink/55">
              Bridged calls between clients and lawyers, over the phone network.
            </p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={toggle}
          disabled={saving}
          className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${
            enabled ? 'bg-emerald-500' : 'bg-ink/15'
          }`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
              enabled ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
          {saving && (
            <Loader2 className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 animate-spin text-white" />
          )}
        </button>
      </div>

      <p className="mt-4 text-xs text-ink/45">
        {enabled
          ? 'On — audio consultations dial out through the configured provider.'
          : 'Off — audio consultations are turned away with a friendly message. No calls are placed.'}
        {settings?.updatedAt && (
          <> Last changed {formatDate(settings.updatedAt)}{settings.updatedBy ? ` by ${settings.updatedBy}` : ''}.</>
        )}
      </p>

      {error && (
        <p className="mt-3 flex items-start gap-2 text-sm text-red-600">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </section>
  );
}
