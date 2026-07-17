'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * AvailabilityToggle — the advocate's online/offline switch. Flipping it saves
 * immediately (PATCH /api/dashboard/profile) and updates their public presence
 * badge on the directory and profile.
 *
 * @param {object} props
 * @param {boolean} props.initialAvailable
 */
export default function AvailabilityToggle({ initialAvailable = false }) {
  const [available, setAvailable] = useState(Boolean(initialAvailable));
  const [saving, setSaving] = useState(false);

  const toggle = async () => {
    if (saving) return;
    const next = !available;
    setSaving(true);
    setAvailable(next); // optimistic
    try {
      const res = await fetch('/api/dashboard/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: next }),
      });
      if (!res.ok) setAvailable(!next); // revert on failure
    } catch {
      setAvailable(!next);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-ink/8 bg-surface p-4 shadow-card sm:p-5">
      <div className="flex items-center gap-3">
        <span className="relative grid h-10 w-10 shrink-0 place-items-center">
          <span
            className={`h-3 w-3 rounded-full ${
              available ? 'bg-emerald-500' : 'bg-ink/25'
            }`}
          />
          {available && (
            <span className="absolute h-3 w-3 animate-ping rounded-full bg-emerald-500/60" />
          )}
        </span>
        <div>
          <p className="text-sm font-semibold text-ink">
            You are {available ? 'Online' : 'Offline'}
          </p>
          <p className="text-xs text-ink/55">
            {available
              ? 'Clients can see you online and start a live consultation.'
              : 'You appear offline and can’t receive live consultations.'}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={toggle}
        disabled={saving}
        role="switch"
        aria-checked={available}
        aria-label="Toggle online availability"
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-70 ${
          available ? 'bg-emerald-500' : 'bg-ink/20'
        }`}
      >
        <span
          className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition-transform ${
            available ? 'translate-x-6' : 'translate-x-1'
          }`}
        >
          {saving && <Loader2 className="h-3 w-3 animate-spin text-ink/50" />}
        </span>
      </button>
    </div>
  );
}
