'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Sparkles, Scale, Download, Loader2, UserPlus, Send, Ban, X, Search, Circle } from 'lucide-react';
import { SearchBox } from '@/components/admin/TableControls';
import Pagination from '@/components/admin/Pagination';
import { formatDate } from '@/utils/formatters';
import { EXPERT_STATUS, RISK_META } from '@/constants/documentReview';

const TABS = [
  { value: '', label: 'All' },
  { value: 'expert:paid', label: 'Needs a lawyer' },
  { value: 'expert:assigned', label: 'In review' },
  { value: 'expert:delivered', label: 'Delivered' },
  { value: 'ai:', label: 'AI reviews' },
];

async function act(body) {
  const res = await fetch('/api/admin/document-reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Could not update the review.');
  return data.review;
}

/**
 * LawyerPicker — who should review this document. Opens on the lawyers who
 * practise in the document's area (online and most experienced first); the
 * search box finds anyone by name, Justiceland ID or city.
 */
function LawyerPicker({ r, onPick, busy }) {
  const [q, setQ] = useState('');
  const [list, setList] = useState(null);

  useEffect(() => {
    let live = true;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/document-reviews/lawyers?area=${encodeURIComponent(r.area)}&q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (live) setList(data.lawyers || []);
      } catch {
        if (live) setList([]);
      }
    }, q ? 300 : 0);
    return () => { live = false; clearTimeout(t); };
  }, [q, r.area]);

  return (
    <div>
      <p className="text-[12px] font-semibold text-ink/55">
        {q ? 'Search results' : `Suggested for ${r.areaLabel.split(' (')[0].toLowerCase()} documents`}
      </p>
      <div className="relative mt-1.5">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search any lawyer by name, ID or city"
          className="h-10 w-full rounded-lg border border-ink/12 bg-white pl-9 pr-3 text-[13px] outline-none focus:border-primary"
        />
      </div>
      <ul className="mt-2 max-h-72 space-y-1.5 overflow-y-auto">
        {list === null ? (
          <li className="py-4 text-center"><Loader2 className="mx-auto h-4 w-4 animate-spin text-ink/40" /></li>
        ) : list.length === 0 ? (
          <li className="py-4 text-center text-[12.5px] text-ink/45">No lawyer found.</li>
        ) : list.map((l) => (
          <li key={l.id} className="flex items-center gap-3 rounded-lg border border-ink/8 bg-white px-3 py-2">
            <Circle className={`h-2.5 w-2.5 shrink-0 ${l.available ? 'fill-emerald-500 text-emerald-500' : 'fill-ink/20 text-ink/20'}`} aria-label={l.available ? 'Online' : 'Offline'} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold text-ink">
                {l.name} <span className="font-mono text-[11px] font-normal text-ink/40">{l.legalCareId}</span>
              </span>
              <span className="block truncate text-[11.5px] text-ink/50">
                {[l.practice, l.city, l.experience ? `${l.experience} yrs` : ''].filter(Boolean).join(' · ')}
              </span>
            </span>
            <button
              type="button"
              disabled={busy || l.id === r.advocateId}
              onClick={() => onPick(l.id)}
              className="h-8 shrink-0 rounded-lg bg-primary px-3 text-[12px] font-semibold text-white hover:bg-primary-dark disabled:opacity-40"
            >
              {l.id === r.advocateId ? 'Assigned' : 'Assign'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** One expert review's controls: assign, write the report, cancel. */
function ExpertActions({ r, onDone }) {
  const [mode, setMode] = useState('');
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const open = ['paid', 'assigned'].includes(r.status);
  if (!open) return null;

  const run = async (body) => {
    setBusy(true);
    setError('');
    try {
      await act(body);
      setMode('');
      setValue('');
      onDone();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (mode) {
    return (
      <div className="mt-3 rounded-xl border border-ink/10 bg-muted/40 p-3">
        {mode === 'assign' ? (
          <LawyerPicker r={r} busy={busy} onPick={(advocate) => run({ id: r.id, action: 'assign', advocate })} />
        ) : mode === 'report' ? (
          <textarea
            rows={8}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="The written report the client will read…"
            className="w-full rounded-lg border border-ink/12 bg-white p-2.5 text-[13px] outline-none focus:border-primary"
          />
        ) : (
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Reason (shown to the client)"
            className="h-10 w-full rounded-lg border border-ink/12 bg-white px-3 text-[13px] outline-none focus:border-primary"
          />
        )}
        {error && <p className="mt-2 text-[12.5px] text-rose-600">{error}</p>}
        <div className="mt-2 flex gap-2">
          {mode !== 'assign' && (
            <button
              type="button"
              disabled={busy || !value.trim()}
              onClick={() => run(
                mode === 'report'
                  ? { id: r.id, action: 'deliver', report: value }
                  : { id: r.id, action: 'cancel', note: value }
              )}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-[12.5px] font-semibold text-white disabled:opacity-40"
            >
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {mode === 'report' ? 'Send report to client' : 'Cancel review'}
            </button>
          )}
          <button type="button" onClick={() => setMode('')} className="inline-flex h-9 items-center rounded-lg px-3 text-[12.5px] text-ink/55 hover:bg-ink/5">
            <X className="h-4 w-4" /> Close
          </button>
        </div>
      </div>
    );
  }

  const btn = 'inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[12px] font-semibold transition-colors';
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" onClick={() => setMode('assign')} className={`${btn} border-sky-500/30 text-sky-700 hover:bg-sky-500/10`}>
        <UserPlus className="h-3.5 w-3.5" /> {r.advocateName ? 'Reassign' : 'Assign lawyer'}
      </button>
      <button type="button" onClick={() => setMode('report')} className={`${btn} border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10`}>
        <Send className="h-3.5 w-3.5" /> Write report
      </button>
      <button type="button" onClick={() => setMode('cancel')} className={`${btn} border-rose-500/30 text-rose-600 hover:bg-rose-500/10`}>
        <Ban className="h-3.5 w-3.5" /> Cancel
      </button>
    </div>
  );
}

/**
 * DocumentReviewsTable — every paid review. Expert reviews are worked from
 * here: assign a lawyer by their Justiceland ID (they then write the report
 * from their dashboard), or write the report here directly. Cancelling only
 * records the decision; the refund is made from the Razorpay dashboard.
 */
export default function DocumentReviewsTable({ reviews, meta }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(meta.search || '');
  const tab = `${meta.kind}${meta.kind || meta.status ? ':' : ''}${meta.status}`;

  const go = (next) => startTransition(() => {
    const qs = new URLSearchParams();
    if (next.q) qs.set('q', next.q);
    const [kind, status] = String(next.tab || '').split(':');
    if (kind) qs.set('kind', kind);
    if (status) qs.set('status', status);
    router.replace(qs.toString() ? `${pathname}?${qs}` : pathname, { scroll: false });
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex flex-wrap rounded-xl border border-ink/10 bg-surface p-1">
          {TABS.map((t) => (
            <button
              key={t.value || 'all'}
              type="button"
              onClick={() => go({ q: search.trim(), tab: t.value })}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                (tab || '') === t.value ? 'bg-primary text-white' : 'text-ink/60 hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <SearchBox
          value={search}
          onChange={(v) => { setSearch(v); go({ q: v.trim(), tab }); }}
          placeholder="Search client, file, lawyer, payment ID…"
        />
        {pending && <Loader2 className="h-4 w-4 animate-spin text-ink/40" />}
      </div>

      {reviews.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink/15 py-14 text-center text-sm text-ink/45">
          No reviews here yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => {
            const ai = r.kind === 'ai';
            const tag = ai
              ? RISK_META[r.ai?.riskLevel] || { label: r.status === 'done' ? 'Done' : 'Processing', tone: 'bg-ink/8 text-ink/55' }
              : EXPERT_STATUS[r.status] || EXPERT_STATUS.paid;
            return (
              <li key={r.id} className="rounded-2xl border border-ink/8 bg-surface p-4 shadow-card">
                <div className="flex flex-wrap items-start gap-3">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${ai ? 'bg-primary/10 text-primary' : 'bg-accent/15 text-[#9A7B1C]'}`}>
                    {ai ? <Sparkles className="h-5 w-5" /> : <Scale className="h-5 w-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">{r.ai?.documentType || r.fileName}</p>
                    <p className="mt-0.5 text-xs text-ink/50">
                      {ai ? 'AI review' : `Lawyer review · ${r.areaLabel}`} · {r.pages} page{r.pages === 1 ? '' : 's'} ·{' '}
                      <b className="text-emerald-600">₹{r.amount.toLocaleString('en-IN')}</b> · {formatDate(r.createdAt)}
                    </p>
                    <p className="mt-1 text-xs text-ink/60">
                      Client:{' '}
                      <Link href={`/admin/users/${r.userId}`} className="font-medium text-primary hover:underline">
                        {r.userName || r.userPhone || 'Client'}
                      </Link>
                      {r.userPhone ? ` · ${r.userPhone}` : ''}
                      {r.advocateName && (
                        <>
                          {' '}· Lawyer:{' '}
                          <Link href={`/admin/advocates/${r.advocateId}`} className="font-medium text-primary hover:underline">
                            {r.advocateName}
                          </Link>
                        </>
                      )}
                    </p>
                    {r.question && <p className="mt-2 rounded-lg bg-muted/50 px-3 py-2 text-[12.5px] text-ink/70">“{r.question}”</p>}
                    {r.status === 'delivered' && r.report && (
                      <details className="mt-2 text-[12.5px] text-ink/70">
                        <summary className="cursor-pointer font-semibold text-emerald-700">Report sent {formatDate(r.deliveredAt)}</summary>
                        <p className="mt-1 whitespace-pre-wrap">{r.report}</p>
                      </details>
                    )}
                    {r.paidWith === 'wallet' ? (
                      <p className="mt-1 text-[11px] font-semibold text-sky-700">Paid from wallet</p>
                    ) : r.razorpayPaymentId ? (
                      <p className="mt-1 font-mono text-[11px] text-ink/40">{r.razorpayPaymentId}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tag.tone}`}>{tag.label}</span>
                    {r.hasFile && (
                      <a
                        href={`/api/document-review/${r.id}/file`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Open document"
                        className="grid h-8 w-8 place-items-center rounded-lg text-ink/50 hover:bg-primary/10 hover:text-primary"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
                {!ai && <ExpertActions r={r} onDone={() => router.refresh()} />}
              </li>
            );
          })}
        </ul>
      )}

      <Pagination
        page={meta.page}
        totalPages={meta.totalPages}
        total={meta.total}
        perPage={meta.perPage}
        basePath="/admin/document-reviews"
        extra={{
          ...(meta.search ? { q: meta.search } : {}),
          ...(meta.kind ? { kind: meta.kind } : {}),
          ...(meta.status ? { status: meta.status } : {}),
        }}
        label="Document reviews pagination"
      />
    </div>
  );
}
