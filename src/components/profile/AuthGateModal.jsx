'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { X, UserPlus, LogIn, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui';

/**
 * AuthGateModal — prompts a visitor to create an account / log in before they
 * can contact an advocate. Shown when a signed-out visitor taps Call / WhatsApp
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

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-gate-title"
    >
      <div
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm rounded-2xl border border-ink/10 bg-surface p-6 shadow-card-hover">
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
          <span className="font-medium text-ink/80">{advocateName || 'this advocate'}</span>{' '}
          and save advocates you like. It only takes a minute.
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
    </div>
  );
}
