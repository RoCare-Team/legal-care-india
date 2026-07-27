'use client';

import { MapPin, ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useLocation } from './LocationProvider';

/**
 * LocationPicker — the header control that opens the location chooser and, once
 * one is set, shows it. The label is truncated hard: an OpenStreetMap place
 * name can run to half a line, and the header has room for a couple of words.
 *
 * @param {object} props
 * @param {boolean} [props.onDark]   sitting over the dark homepage hero
 * @param {boolean} [props.fullWidth] fill its container (the mobile drawer)
 * @param {string} [props.className]
 */
export default function LocationPicker({ onDark = false, fullWidth = false, className }) {
  const { location, ready, openPicker } = useLocation();

  const label = location?.label || 'Set your location';

  return (
    <>
      <button
        type="button"
        onClick={openPicker}
        title={location ? `${label} — tap to change` : 'Choose your location'}
        className={cn(
          'flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-sm transition-colors',
          fullWidth ? 'w-full' : 'max-w-[160px]',
          onDark
            ? 'border-white/20 bg-white/10 text-white hover:border-white/40'
            : 'border-ink/12 bg-surface text-ink/75 hover:border-primary/40 hover:text-primary',
          className
        )}
      >
        <MapPin
          className={cn('h-4 w-4 shrink-0', onDark ? 'text-accent' : 'text-primary')}
          aria-hidden="true"
        />
        <span
          className={cn(
            'min-w-0 flex-1 truncate text-left font-medium',
            // Before the saved value is read, keep the width but say nothing —
            // flashing "Set your location" at someone who has one is worse.
            !ready && 'opacity-0'
          )}
        >
          {label}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
      </button>
    </>
  );
}
