'use client';

import { useEffect, useState } from 'react';
import { Copy, Check, Terminal, ChevronDown, AlertTriangle } from 'lucide-react';

function CopyButton({ text }) {
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
      {copied ? 'Copied' : 'Copy'}
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
 * BlogApiCard — how to post articles from outside the panel (a script, n8n,
 * an AI writer): the curl for each call. The API is open; no key is needed.
 */
export default function BlogApiCard() {
  const [origin, setOrigin] = useState('https://justiceland.online');
  const [open, setOpen] = useState(false);

  useEffect(() => setOrigin(window.location.origin), []);

  const base = `${origin}/api/v1/blogs`;
  const curlCreate = `curl -X POST "${base}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "How to send a cheque bounce notice",
    "excerpt": "The 30-day deadline, what the notice must say, and what happens next.",
    "category": "Legal Guide",
    "author": "Adv. Ravi Sharma",
    "coverImage": "https://example.com/cover.jpg",
    "published": true,
    "content": "A cheque bounce is a criminal offence under Section 138.\\n\\n## The 30-day deadline\\nYou must send the notice within 30 days of the bank memo."
  }'`;
  const curlList = `curl "${base}"`;
  const curlUpdate = `curl -X PATCH "${base}/how-to-send-a-cheque-bounce-notice" \\
  -H "Content-Type: application/json" \\
  -d '{ "published": false }'`;
  const curlDelete = `curl -X DELETE "${base}/how-to-send-a-cheque-bounce-notice"`;

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
            Post articles from a script, n8n or an AI writer — curl examples inside.
          </span>
        </span>
        <ChevronDown className={`h-5 w-5 text-ink/40 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="space-y-3 border-t border-ink/8 p-5">
          <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            This API needs no key — anyone who knows the address can post, edit or delete articles written here or
            through it. Keep an eye on the list below for anything you did not write.
          </p>

          <p className="text-sm font-semibold text-ink">Publish an article</p>
          <Code>{curlCreate}</Code>
          <p className="text-xs leading-relaxed text-ink/55">
            Required: <code className="font-mono">title</code> (4–200 chars), <code className="font-mono">content</code>{' '}
            (20+ chars, plain text — a blank line between paragraphs, a line starting with{' '}
            <code className="font-mono">## </code> is a heading; no HTML). Optional: <code className="font-mono">excerpt</code>,{' '}
            <code className="font-mono">category</code>, <code className="font-mono">author</code> (shown as &ldquo;By …&rdquo;),{' '}
            <code className="font-mono">coverImage</code> (https URL),{' '}
            <code className="font-mono">published</code> (default true; false saves a draft),{' '}
            <code className="font-mono">slug</code> (default: from the title). Returns <code className="font-mono">201</code>{' '}
            with the article and its <code className="font-mono">url</code>; <code className="font-mono">409</code> if the slug exists.
          </p>
          <p className="text-sm font-semibold text-ink">List · edit · delete</p>
          <Code>{curlList}</Code>
          <Code>{curlUpdate}</Code>
          <Code>{curlDelete}</Code>
        </div>
      )}
    </section>
  );
}
