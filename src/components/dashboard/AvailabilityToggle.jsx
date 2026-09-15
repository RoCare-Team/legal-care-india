'use client';

import { Loader2 } from 'lucide-react';
import { useAvailability } from '@/hooks/useAvailability';

/**
 * AvailabilityToggle — the lawyer's online/offline switch. Flipping it saves
 * immediately (PATCH /api/dashboard/profile) and updates their public presence
 * badge on the directory and profile. Every other availability control on the
 * dashboard follows it (see useAvailability).
 *
 * @param {object} props
 * @param {boolean} props.initialAvailable
 * @param {'pill'|'hero'} [props.variant='pill']  'hero' is the large white
 *   capsule that sits on the navy topbar.
 */
export default function AvailabilityToggle({ initialAvailable = false, variant = 'pill' }) {
  const { available, saving, setAvailable } = useAvailability(initialAvailable);
  const hero = variant === 'hero';

  return (
    <button
      type="button"
      onClick={() => !saving && setAvailable(!available)}
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
      className={
        hero
          ? `inline-flex shrink-0 items-center gap-4 rounded-full py-2 pl-5 pr-2 shadow-card transition-colors disabled:opacity-80 ${
              available ? 'bg-emerald-50 hover:bg-white' : 'bg-white/90 hover:bg-white'
            }`
          : `inline-flex shrink-0 items-center gap-2 rounded-full border py-1.5 pl-3 pr-1.5 transition-colors disabled:opacity-70 ${
              available
                ? 'border-emerald-500/30 bg-emerald-500/[0.08] hover:border-emerald-500/50'
                : 'border-ink/12 bg-ink/[0.03] hover:border-ink/25'
            }`
      }
    >
      {!hero && (
        <span className="relative grid h-2.5 w-2.5 shrink-0 place-items-center">
          <span className={`h-2.5 w-2.5 rounded-full ${available ? 'bg-emerald-500' : 'bg-ink/30'}`} />
          {available && (
            <span className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-emerald-500/60" />
          )}
        </span>
      )}

      <span
        className={`font-semibold ${hero ? 'text-base' : 'text-xs'} ${
          available ? 'text-emerald-700' : hero ? 'text-ink/70' : 'text-ink/60'
        }`}
      >
        {available ? 'Online' : 'Offline'}
      </span>

      <span
        className={`relative inline-flex shrink-0 items-center rounded-full transition-colors ${
          hero ? 'h-8 w-14' : 'h-5 w-9'
        } ${available ? 'bg-emerald-500' : 'bg-ink/20'}`}
      >
        <span
          className={`inline-flex items-center justify-center rounded-full bg-white shadow transition-transform ${
            hero
              ? `h-6 w-6 ${available ? 'translate-x-7' : 'translate-x-1'}`
              : `h-4 w-4 ${available ? 'translate-x-[1.125rem]' : 'translate-x-0.5'}`
          }`}
        >
          {saving && <Loader2 className="h-2.5 w-2.5 animate-spin text-ink/50" />}
        </span>
      </span>
    </button>
  );
}
