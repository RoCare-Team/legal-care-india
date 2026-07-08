'use client';

import { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui';

/**
 * DeleteAccount — a "Danger Zone" card that lets an advocate permanently
 * delete their own account. Requires typing DELETE to confirm, calls
 * `DELETE /api/dashboard/profile`, then sends the (now signed-out) user home.
 */
export default function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const canDelete = confirmText.trim().toUpperCase() === 'DELETE';

  const closeModal = () => {
    if (deleting) return;
    setOpen(false);
    setConfirmText('');
    setError('');
  };

  const onDelete = async () => {
    if (!canDelete) return;
    setDeleting(true);
    setError('');
    try {
      const res = await fetch('/api/dashboard/profile', { method: 'DELETE' });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload.error || 'Could not delete your account. Please try again.');
        setDeleting(false);
        return;
      }
      // Account gone and session cleared — full navigation resets everything.
      window.location.href = '/?deleted=1';
    } catch {
      setError('Network error. Check your connection and try again.');
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-100 text-red-600">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-display text-lg font-semibold text-red-700">Delete account</h3>
            <p className="mt-1 max-w-xl text-sm text-red-700/70">
              This permanently removes your profile from the public directory and deletes
              all your data. This action cannot be undone.
            </p>
          </div>
        </div>
        <Button
          type="button"
          onClick={() => setOpen(true)}
          leftIcon={<Trash2 className="h-4 w-4" />}
          className="shrink-0 border border-red-300 bg-white text-red-600 hover:border-red-500 hover:bg-red-600 hover:text-white"
          variant="ghost"
        >
          Delete account
        </Button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-red-100 text-red-600">
                <AlertTriangle className="h-6 w-6" aria-hidden="true" />
              </span>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-lg text-ink/50 hover:bg-ink/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <h2 id="delete-account-title" className="mt-4 font-display text-xl font-semibold text-ink">
              Delete your account?
            </h2>
            <p className="mt-2 text-sm text-ink/60">
              Your public profile and all associated data will be permanently deleted. You
              will be signed out immediately. This cannot be undone.
            </p>

            <label className="mt-5 block text-sm font-medium text-ink">
              Type <span className="font-mono font-semibold text-red-600">DELETE</span> to confirm
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                autoComplete="off"
                placeholder="DELETE"
                className="mt-2 w-full rounded-xl border border-ink/15 px-3 py-2.5 text-sm text-ink outline-none focus:border-red-400 focus:ring-2 focus:ring-red-200"
              />
            </label>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={closeModal} disabled={deleting}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={onDelete}
                disabled={!canDelete || deleting}
                leftIcon={<Trash2 className="h-4 w-4" />}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {deleting ? 'Deleting…' : 'Delete permanently'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
