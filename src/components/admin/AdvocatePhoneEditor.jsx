'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, Pencil, Check, X, Loader2 } from 'lucide-react';

/**
 * The one way back in for a lawyer locked out of their own account.
 *
 * Signing in is a code sent to the stored number, so a number that is wrong is
 * a door with no handle on the inside — there is no password and no reset
 * email to fall back on. This is the handle, on the outside.
 *
 * It reads as text until someone clicks the pencil, because on the fifty
 * profiles an admin opens for other reasons this is not a field they are
 * editing, it is a fact they are reading.
 *
 * @param {object} props
 * @param {string} props.id     the lawyer's MongoDB _id
 * @param {string} props.phone  the number currently on the account
 */
export default function AdvocatePhoneEditor({ id, phone }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(phone || '').replace(/\D/g, '').slice(-10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const cancel = () => {
    setEditing(false);
    setError('');
    setValue(String(phone || '').replace(/\D/g, '').slice(-10));
  };

  const save = async () => {
    if (!/^[6-9]\d{9}$/.test(value)) {
      setError('Enter a valid 10-digit Indian mobile number.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/advocates/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, phone: value }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.message || payload.error || 'Could not save the number.');
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <Phone className="h-3.5 w-3.5 text-ink/35" aria-hidden="true" />
        {phone || '—'}
        <button
          type="button"
          onClick={() => setEditing(true)}
          title="Change the number this lawyer signs in with"
          aria-label="Change login number"
          className="ml-1 grid h-6 w-6 place-items-center rounded-md text-ink/35 transition-colors hover:bg-ink/5 hover:text-primary"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </span>
    );
  }

  return (
    <span className="inline-block">
      <span className="flex items-center gap-1.5">
        <span className="text-ink/45">+91</span>
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value.replace(/\D/g, '').slice(0, 10));
            setError('');
          }}
          inputMode="numeric"
          autoFocus
          className="w-32 rounded-lg border border-ink/20 px-2 py-1 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="button"
          onClick={save}
          disabled={saving}
          aria-label="Save number"
          className="grid h-7 w-7 place-items-center rounded-md bg-emerald-600 text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          onClick={cancel}
          disabled={saving}
          aria-label="Cancel"
          className="grid h-7 w-7 place-items-center rounded-md bg-ink/8 text-ink/60 transition-colors hover:bg-ink/15"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </span>
      {error ? (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      ) : (
        <span className="mt-1 block text-xs text-ink/45">
          This is the number the login code is sent to.
        </span>
      )}
    </span>
  );
}
