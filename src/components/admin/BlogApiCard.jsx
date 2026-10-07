'use client';

import { useCallback, useEffect, useState } from 'react';
import { KeyRound, Copy, Check, Loader2, Trash2, Plus, AlertTriangle, Terminal, ChevronDown } from 'lucide-react';
import { formatDate } from '@/utils/formatters';

function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard blocked — the text is on screen */
        }
      }}
      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-ink/12 bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink/70 hover:border-primary/40 hover:text-primary"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : label}
    </button>
  );
}

function Code({ children }) {
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-xl bg-[#0B1424] p-4 pr-20 text-[12px] leading-relaxed text-emerald-100">
        <code>{children}</code>
      </pre>
      <div className="absolute right-2 top-2">
        <CopyButton text={children} />
      </div>
    </div>
  );
}

/**
 * BlogApiCard — API keys for posting articles from outside the panel (a
 * script, n8n, an AI writer), and the curl to do it with.
 *
 * A key is shown in full once, when made; after that only its first
 * characters, because the server keeps nothing but a hash of it.
 */
export default function BlogApiCard() {
  const [origin, setOrigin] = useState('https://justiceland.online');
  const [keys, setKeys] = useState(null);
  const [name, setName] = useState('');
  const [fresh, setFresh] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => setOrigin(window.location.origin), []);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/api-keys?scope=blogs', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) setKeys(data.keys || []);
    } catch {
      setKeys([]);
    }
  }, []);

  useEffect(() => {
    if (open && keys === null) load();
  }, [open, keys, load]);

  const create = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not create the key.');
      setFresh(data.key);
      setName('');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (id) => {
    if (!window.confirm('Revoke this key? Anything using it stops working immediately.')) return;
    await fetch(`/api/admin/api-keys?id=${id}`, { method: 'DELETE' });
    load();
  };

  const key = fresh || 'YOUR_API_KEY';
  const base = `${origin}/api/v1/blogs`;
  const curlCreate = `curl -X POST "${base}" \\
  -H "Authorization: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "How to send a cheque bounce notice",
    "excerpt": "The 30-day deadline, what the notice must say, and what happens next.",
    "category": "Legal Guide",
    "coverImage": "https://example.com/cover.jpg",
    "published": true,
    "content": "A cheque bounce is a criminal offence under Section 138.\\n\\n## The 30-day deadline\\nYou must send the notice within 30 days of the bank memo."
  }'`;
  const curlList = `curl "${base}" -H "Authorization: Bearer ${key}"`;
  const curlUpdate = `curl -X PATCH "${base}/how-to-send-a-cheque-bounce-notice" \\
  -H "Authorization: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -d '{ "published": false }'`;
  const curlDelete = `curl -X DELETE "${base}/how-to-send-a-cheque-bounce-notice" \\
  -H "Authorization: Bearer ${key}"`;

  return (
    <section className="mb-6 rounded-2xl border border-ink/8 bg-surface shadow-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 p-5 text-left"
        aria-expanded={open}
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Terminal className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-lg font-semibold text-ink">Blog API</span>
          <span className="block text-sm text-ink/55">
            Post articles from a script, n8n or an AI writer with an API key — curl examples inside.
          </span>
        </span>
        <ChevronDown className={`h-5 w-5 text-ink/40 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="space-y-5 border-t border-ink/8 p-5">
          {/* Make a key */}
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">1. Create an API key</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='Name it, e.g. "n8n blog writer"'
                className="h-10 flex-1 rounded-xl border border-ink/12 px-3 text-sm outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={create}
                disabled={busy || name.trim().length < 2}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create key
              </button>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

            {fresh && (
              <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                  <AlertTriangle className="h-4 w-4" /> Copy it now — this key is shown only once.
                </p>
                <div className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-lg bg-white px-3 py-2 font-mono text-xs text-ink">{fresh}</code>
                  <CopyButton text={fresh} />
                </div>
              </div>
            )}

            {/* Existing keys */}
            <ul className="mt-3 divide-y divide-ink/8 rounded-xl border border-ink/8">
              {keys === null ? (
                <li className="flex items-center gap-2 px-3 py-3 text-sm text-ink/50">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading keys…
                </li>
              ) : keys.length === 0 ? (
                <li className="px-3 py-3 text-sm text-ink/50">No keys yet.</li>
              ) : (
                keys.map((k) => (
                  <li key={k.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                    <KeyRound className={`h-4 w-4 ${k.revoked ? 'text-ink/25' : 'text-primary'}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold ${k.revoked ? 'text-ink/40 line-through' : 'text-ink'}`}>{k.name}</p>
                      <p className="text-xs text-ink/45">
                        <span className="font-mono">{k.prefix}…</span> · made {formatDate(k.createdAt)}
                        {k.lastUsedAt ? ` · last used ${formatDate(k.lastUsedAt)}` : ' · never used'}
                      </p>
                    </div>
                    {k.revoked ? (
                      <span className="text-xs font-semibold text-ink/40">Revoked</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => revoke(k.id)}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Revoke
                      </button>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* How to call it */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-ink">2. Publish an article</p>
            <Code>{curlCreate}</Code>
            <p className="text-xs leading-relaxed text-ink/55">
              Required: <code className="font-mono">title</code> (4–200 chars), <code className="font-mono">content</code>{' '}
              (20+ chars, plain text — a blank line between paragraphs, a line starting with{' '}
              <code className="font-mono">## </code> is a heading; no HTML). Optional: <code className="font-mono">excerpt</code>,{' '}
              <code className="font-mono">category</code>, <code className="font-mono">coverImage</code> (https URL),{' '}
              <code className="font-mono">published</code> (default true; false saves a draft),{' '}
              <code className="font-mono">slug</code> (default: from the title). Returns <code className="font-mono">201</code>{' '}
              with the article and its <code className="font-mono">url</code>; <code className="font-mono">409</code> if the slug exists.
            </p>
            <p className="text-sm font-semibold text-ink">List · edit · delete</p>
            <Code>{curlList}</Code>
            <Code>{curlUpdate}</Code>
            <Code>{curlDelete}</Code>
          </div>
        </div>
      )}
    </section>
  );
}
