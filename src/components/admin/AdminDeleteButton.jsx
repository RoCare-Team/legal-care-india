'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';

/**
 * Permanently deletes one lawyer or one client from their own admin page, then
 * returns to the list. Asks the admin to type DELETE first, because on a detail
 * page the button sits beside everything else about that person and a stray
 * click must not cost an account.
 *
 * @param {object} props
 * @param {'advocate'|'user'} props.kind
 * @param {string} props.id
 * @param {string} props.name
 */
export default function AdminDeleteButton({ kind, id, name }) {
  const [busy, setBusy] = useState(false);
  const label = kind === 'advocate' ? 'lawyer' : 'user';
  const api = kind === 'advocate' ? '/api/admin/advocates' : '/api/admin/users';
  const back = kind === 'advocate' ? '/admin/advocates' : '/admin/users';

  const remove = async () => {
    const typed = window.prompt(
      `Delete ${label} "${name}" permanently?\n\nTheir account${kind === 'advocate' ? ' and public listing' : ''} will be removed. This cannot be undone.\n\nType DELETE to confirm.`
    );
    if (typed?.trim() !== 'DELETE') return;

    setBusy(true);
    try {
      const res = await fetch(`${api}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        window.alert(data.error || `Could not delete this ${label}.`);
        setBusy(false);
        return;
      }
      // A full load rather than a client transition: the page being left no
      // longer exists, and a refresh racing the navigation can keep it on screen.
      window.location.replace(back);
    } catch {
      window.alert('Could not reach the server. Please try again.');
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={remove}
      disabled={busy}
      className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 px-3 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-500/10 disabled:opacity-50"
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />}
      Delete {label}
    </button>
  );
}
