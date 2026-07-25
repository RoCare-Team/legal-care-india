'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * AvailabilityToggle — the lawyer's online/offline switch. Flipping it saves
 * immediately (PATCH /api/dashboard/profile) and updates their public presence
 * badge on the directory and profile.
 *
 * A compact pill rather than a banner: it is a one-word status they glance at,
 * not a section of the page, so it sits inline in the topbar next to their name.
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
    <button
      type="button"
      onClick={toggle}
      disabled={saving}
      role="switch"
      aria-checked={available}
      // The label carries the state for screen readers, so the title can stay
      // short enough to sit in a pill.
      aria-label={`You are ${available ? 'online' : 'offline'} — tap to go ${available ? 'offline' : 'online'}`}
      title={
        available
          ? 'Clients can see you online and start a consultation'
          : 'You appear offline and can’t receive consultations'
      }
      className={`inline-flex shrink-0 items-center gap-2 rounded-full border py-1.5 pl-3 pr-1.5 transition-colors disabled:opacity-70 ${
        available
          ? 'border-emerald-500/30 bg-emerald-500/[0.08] hover:border-emerald-500/50'
          : 'border-ink/12 bg-ink/[0.03] hover:border-ink/25'
      }`}
    >
      <span className="relative grid h-2.5 w-2.5 shrink-0 place-items-center">
        <span className={`h-2.5 w-2.5 rounded-full ${available ? 'bg-emerald-500' : 'bg-ink/30'}`} />
        {available && (
          <span className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-emerald-500/60" />
        )}
      </span>

      <span
        className={`text-xs font-semibold ${available ? 'text-emerald-700' : 'text-ink/60'}`}
      >
        {available ? 'Online' : 'Offline'}
      </span>

      <span
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          available ? 'bg-emerald-500' : 'bg-ink/20'
        }`}
      >
        <span
          className={`inline-flex h-4 w-4 items-center justify-center rounded-full bg-white shadow transition-transform ${
            available ? 'translate-x-[1.125rem]' : 'translate-x-0.5'
          }`}
        >
          {saving && <Loader2 className="h-2.5 w-2.5 animate-spin text-ink/50" />}
        </span>
      </span>
    </button>
  );
}
