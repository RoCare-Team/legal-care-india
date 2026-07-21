'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';

/**
 * RemoveConsultationButton — clears a consultation from the lawyer's
 * dashboard. The record itself is kept, so the client still sees the
 * consultation they paid for and earnings totals stay accurate.
 *
 * @param {object} props
 * @param {string} props.id        consultation id
 * @param {string} props.name      client name (for the confirm prompt)
 */
export default function RemoveConsultationButton({ id, name }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    const ok = window.confirm(
      `Remove the consultation with ${name} from your dashboard?\n\nYour earnings are not affected, and the client keeps their own record.`
    );
    if (!ok) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/consultations/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        window.alert(data.error || 'Could not remove it. Please try again.');
        return;
      }
      router.refresh();
    } catch {
      window.alert('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={remove}
      disabled={busy}
      aria-label={`Remove consultation with ${name}`}
      title="Remove from dashboard"
      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink/35 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </button>
  );
}
