'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { X, UserPlus, LogIn, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui';

/**
 * AuthGateModal — prompts a visitor to create an account / log in before they
 * can contact a lawyer. Shown when a signed-out visitor taps Call / WhatsApp
 * / Email on a profile.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {string} [props.advocateName]
 */
export default function AuthGateModal({ open, onClose, advocateName }) {
  const pathname = usePathname();
  const next = pathname ? `?next=${encodeURIComponent(pathname)}` : '';
  // The modal is portalled to <body>, which only exists on the client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);

    // Lock scrolling, but replace the scrollbar's width with padding — hiding
    // it outright reflows the whole page and makes the content jump/flicker.
    const { body } = document;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;
    body.style.overflow = 'hidden';
    if (gap > 0) body.style.paddingRight = `${gap}px`;

    return () => {
      document.removeEventListener('keydown', onKey);
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  // Portalled to <body>: any transformed ancestor (e.g. the lawyer card's
  // hover lift) would otherwise become the containing block for `fixed`, so the
  // modal would render inside the card instead of centred on the viewport.
  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-gate-title"
    >
      <div
        className="absolute inset-0 bg-ink/60"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md rounded-2xl border border-ink/10 bg-surface p-7 shadow-card-hover sm:p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-ink/50 hover:bg-ink/5 hover:text-ink"
        >
          <X className="h-5 w-5" />
        </button>

        <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
          <ShieldCheck className="h-6 w-6" />
        </span>

        <h2 id="auth-gate-title" className="mt-4 font-display text-xl font-semibold text-ink">
          Create a free account
        </h2>
        <p className="mt-1.5 text-sm text-ink/60">
          Sign up or log in to contact{' '}
          <span className="font-medium text-ink/80">{advocateName || 'this lawyer'}</span>{' '}
          and save lawyers you like. It only takes a minute.
        </p>

        <div className="mt-5 space-y-2">
          <Button href={`/user/signup${next}`} fullWidth leftIcon={<UserPlus className="h-4 w-4" />}>
            Sign Up — it&apos;s free
          </Button>
          <Button href={`/user/login${next}`} variant="outline" fullWidth leftIcon={<LogIn className="h-4 w-4" />}>
            I already have an account
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
