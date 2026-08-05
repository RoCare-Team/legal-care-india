'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Trash2, Check, CornerUpLeft, Loader2 } from 'lucide-react';
import { AdminAvatar } from './DataTable';
import { formatDate } from '@/utils/formatters';

/**
 * ContactMessages — the admin view of everything sent through the public
 * contact form.
 *
 * Rendered as cards rather than a table: the message itself is the point, and a
 * paragraph does not survive being squeezed into a table cell. Each card can be
 * marked read or replied, answered by email, or deleted if it is spam.
 *
 * @param {object} props
 * @param {Array} props.messages  newest first, from adminGetContactMessages
 */
const STATUS_STYLES = {
  new: 'bg-primary/10 text-primary',
  read: 'bg-ink/8 text-ink/55',
  replied: 'bg-emerald-500/10 text-emerald-600',
};

export default function ContactMessages({ messages }) {
  const router = useRouter();
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  // Which tab is showing. 'all' first so nothing is hidden by default.
  const [filter, setFilter] = useState('all');

  const send = async (method, body, id) => {
    setBusy(id);
    setError('');
    try {
      const res = await fetch('/api/admin/contacts', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || 'Something went wrong.');
        return;
      }
      router.refresh();
    } catch {
      setError('Could not reach the server.');
    } finally {
      setBusy('');
    }
  };

  const setStatus = (id, status) => send('PATCH', { id, status }, id);

  const remove = (id) => {
    if (!window.confirm('Delete this message permanently?')) return;
    send('DELETE', { id }, id);
  };

  const counts = {
    all: messages.length,
    new: messages.filter((m) => m.status === 'new').length,
    read: messages.filter((m) => m.status === 'read').length,
    replied: messages.filter((m) => m.status === 'replied').length,
  };

  const shown = filter === 'all' ? messages : messages.filter((m) => m.status === filter);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', 'new', 'read', 'replied'].map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
              filter === key
                ? 'bg-primary text-white'
                : 'border border-ink/10 bg-surface text-ink/60 hover:border-primary/30 hover:text-primary'
            }`}
          >
            {key} ({counts[key]})
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </p>
      )}

      {shown.length === 0 ? (
        <div className="mt-6 grid place-items-center rounded-2xl border border-dashed border-ink/15 bg-surface px-6 py-14 text-center">
          <Mail className="h-9 w-9 text-ink/25" aria-hidden="true" />
          <p className="mt-3 text-sm text-ink/55">
            {filter === 'all'
              ? 'No messages yet. Anything sent through the contact form lands here.'
              : `No ${filter} messages.`}
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {shown.map((m) => (
            <li
              key={m.id}
              className="rounded-2xl border border-ink/8 bg-surface p-5 shadow-card"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <AdminAvatar name={m.name} tone="bg-primary/10 text-primary" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{m.name}</p>
                    <a
                      href={`mailto:${m.email}`}
                      className="truncate text-xs text-primary hover:underline"
                    >
                      {m.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${STATUS_STYLES[m.status]}`}
                  >
                    {m.status}
                  </span>
                  <span className="text-xs text-ink/40">{formatDate(m.createdAt)}</span>
                </div>
              </div>

              {m.subject && (
                <p className="mt-4 text-sm font-semibold text-ink">{m.subject}</p>
              )}
              <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink/70">
                {m.message}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink/8 pt-4">
                <a
                  href={`mailto:${m.email}?subject=${encodeURIComponent(
                    m.subject ? `Re: ${m.subject}` : 'Re: your message to Justiceland'
                  )}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-dark"
                >
                  <CornerUpLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  Reply by email
                </a>

                {m.status !== 'read' && (
                  <button
                    type="button"
                    disabled={busy === m.id}
                    onClick={() => setStatus(m.id, 'read')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-ink/12 px-3 py-1.5 text-xs font-semibold text-ink/65 transition-colors hover:border-primary/30 hover:text-primary disabled:opacity-50"
                  >
                    Mark read
                  </button>
                )}

                {m.status !== 'replied' && (
                  <button
                    type="button"
                    disabled={busy === m.id}
                    onClick={() => setStatus(m.id, 'replied')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-ink/12 px-3 py-1.5 text-xs font-semibold text-ink/65 transition-colors hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    Mark replied
                  </button>
                )}

                <button
                  type="button"
                  disabled={busy === m.id}
                  onClick={() => remove(m.id)}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-ink/12 px-3 py-1.5 text-xs font-semibold text-ink/55 transition-colors hover:border-rose-300 hover:text-rose-600 disabled:opacity-50"
                >
                  {busy === m.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
