'use client';

import { useState } from 'react';
import { LogIn, Loader2 } from 'lucide-react';

/**
 * Opens a member's own account as them, without needing their password. Used
 * from both the lawyers and users tables.
 *
 * @param {object} props
 * @param {string} props.id
 * @param {string} props.name
 * @param {'advocate'|'user'} [props.role]
 */
export default function ImpersonateButton({ id, name, role = 'advocate' }) {
  const [busy, setBusy] = useState(false);
  const where = role === 'user' ? 'account' : 'dashboard';

  const open = async () => {
    if (!window.confirm(`Open ${name}'s ${where}? You'll be signed in as them until you click "Back to admin".`)) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        // Full navigation, so every server component re-reads the new cookie.
        window.location.href = data.redirectTo || `/${where}`;
        return;
      }
      window.alert(data.error || 'Could not open that account.');
    } catch {
      window.alert('Could not open that account. Please try again.');
    }
    setBusy(false);
  };

  return (
    <button
      type="button"
      onClick={open}
      disabled={busy}
      title={`Sign in as this ${role}`}
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 disabled:opacity-60"
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
      ) : (
        <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      Login
    </button>
  );
}
