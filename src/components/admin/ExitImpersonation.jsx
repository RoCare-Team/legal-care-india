'use client';

import { useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';

/**
 * The way back out of an admin-opened account. Rendered only while the session
 * is impersonated — without it the admin would have to log the lawyer out to
 * stop being them.
 */
export default function ExitImpersonation({ role = 'advocate', className = 'mt-4 w-full' }) {
  const [busy, setBusy] = useState(false);

  const exit = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/impersonate', { method: 'DELETE' });
      if (res.ok) {
        // Full navigation so nothing keeps rendering with the old cookie.
        window.location.href = role === 'user' ? '/admin/users' : '/admin/advocates';
        return;
      }
    } catch {
      /* fall through to re-enable the button */
    }
    setBusy(false);
  };

  return (
    <button
      type="button"
      onClick={exit}
      disabled={busy}
      className={`flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-ink/55 transition-colors hover:bg-ink/5 hover:text-ink disabled:opacity-60 ${className}`}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
      ) : (
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
      )}
      Back to admin
    </button>
  );
}
