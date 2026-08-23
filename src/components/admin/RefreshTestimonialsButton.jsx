'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Check, Loader2 } from 'lucide-react';

/**
 * RefreshTestimonialsButton — clears the cached homepage testimonial list.
 *
 * The list is cached for an hour, and nothing but a brand-new submission used
 * to clear it. A testimonial corrected in the database therefore sat unseen,
 * with redeploying no help either — Vercel keeps its data cache across
 * deployments. This button is the missing lever.
 */
export default function RefreshTestimonialsButton() {
  const router = useRouter();
  const [state, setState] = useState('idle'); // idle | busy | done | error
  const [message, setMessage] = useState('');

  const refresh = async () => {
    setState('busy');
    setMessage('');
    try {
      const res = await fetch('/api/admin/testimonials/revalidate', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState('error');
        setMessage(data.error || 'Could not refresh.');
        return;
      }
      setState('done');
      setMessage(data.message || 'Refreshed.');
      router.refresh();
      setTimeout(() => setState('idle'), 4000);
    } catch {
      setState('error');
      setMessage('Could not reach the server.');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={refresh}
        disabled={state === 'busy'}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-ink/12 bg-surface px-4 text-sm font-semibold text-ink/70 shadow-sm transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-60"
      >
        {state === 'busy' ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : state === 'done' ? (
          <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
        ) : (
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
        )}
        {state === 'busy' ? 'Refreshing…' : 'Refresh homepage list'}
      </button>

      {message && (
        <span className={`text-xs ${state === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
          {message}
        </span>
      )}
    </div>
  );
}
