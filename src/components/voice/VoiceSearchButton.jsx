'use client';

import { useState } from 'react';
import { Mic } from 'lucide-react';
import VoiceSearchDialog from './VoiceSearchDialog';

/**
 * "Tell us your legal problem" — the way in for someone who does not know
 * which of twelve practice areas their problem belongs to.
 *
 * It sits beside the search box rather than replacing it, because the two
 * answer different visitors: one already knows they want a criminal lawyer in
 * Pune, the other only knows their landlord has kept their deposit.
 *
 * The dialog — microphone, recorder, the whole pipeline — is only mounted once
 * this is pressed, so the homepage carries none of its weight until someone
 * actually wants it.
 */
export default function VoiceSearchButton({ className = '', variant = 'solid' }) {
  const [open, setOpen] = useState(false);

  const styles = variant === 'ghost'
    ? 'border border-primary/25 bg-surface text-primary hover:border-primary/50 hover:bg-primary/5'
    : 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-md hover:shadow-lg';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`group inline-flex items-center gap-2.5 rounded-full px-5 py-3 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 ${styles} ${className}`}
      >
        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${variant === 'ghost' ? 'bg-primary/10' : 'bg-white/15'}`}>
          <Mic className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="text-left leading-tight">
          Tell us your legal problem
          <span className={`block text-[11px] font-medium ${variant === 'ghost' ? 'text-ink/50' : 'text-white/70'}`}>
            Speak in Hindi or English
          </span>
        </span>
      </button>

      <VoiceSearchDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
