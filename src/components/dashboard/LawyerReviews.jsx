'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Download, Send, Loader2, CircleCheck, FileSearch } from 'lucide-react';
import { formatDate } from '@/utils/formatters';
import { EXPERT_STATUS, EXPERT_REVIEW_HOURS } from '@/constants/documentReview';
import { splitEarning } from '@/constants/payouts';

function ReportForm({ review, onSent }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const send = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/dashboard/document-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: review.id, report: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not send the report.');
      onSent();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <div className="mt-4">
      <label htmlFor={`report-${review.id}`} className="text-[12.5px] font-semibold text-ink/60">Your written report</label>
      <textarea
        id={`report-${review.id}`}
        rows={9}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={'Summary of the document\nRisky clauses and why\nWhat to change or add before signing\nAnswer to the client’s worry'}
        className="mt-1.5 w-full rounded-xl border border-ink/12 bg-white p-3 text-[13.5px] leading-relaxed outline-none placeholder:text-ink/35 focus:border-primary"
      />
      {error && <p className="mt-1.5 text-[12.5px] text-rose-600">{error}</p>}
      <button
        type="button"
        onClick={send}
        disabled={busy || text.trim().length < 40}
        className="mt-2 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-40"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Send report to client
      </button>
    </div>
  );
}

/**
 * LawyerReviews — the document reviews an admin has assigned to this lawyer.
 * Open the document, write the report, send it; the lawyer's share of the fee
 * is credited to their earnings the moment it is sent.
 */
export default function LawyerReviews({ reviews = [] }) {
  const router = useRouter();

  if (!reviews.length) {
    return (
      <div className="rounded-2xl border border-dashed border-ink/15 bg-surface px-6 py-14 text-center">
        <FileSearch className="mx-auto h-9 w-9 text-primary/50" aria-hidden="true" />
        <p className="mt-3 font-semibold text-ink">No documents assigned to you yet</p>
        <p className="mt-1 text-sm text-ink/55">When the Justiceland team assigns a client&apos;s document to you, it appears here.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {reviews.map((r) => {
        const meta = EXPERT_STATUS[r.status] || EXPERT_STATUS.assigned;
        const share = splitEarning(r.amount).earning;
        return (
          <li key={r.id} className="rounded-2xl border border-ink/8 bg-surface p-5 shadow-card">
            <div className="flex flex-wrap items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-[#9A7B1C]">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{r.fileName}</p>
                <p className="mt-0.5 text-xs text-ink/50">
                  {r.areaLabel} · {r.pages} page{r.pages === 1 ? '' : 's'} · assigned {formatDate(r.assignedAt)} · you earn{' '}
                  <b className="text-emerald-600">₹{share.toLocaleString('en-IN')}</b>
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.tone}`}>{meta.label}</span>
            </div>

            {r.question && (
              <p className="mt-3 rounded-xl bg-muted/50 px-3.5 py-2.5 text-[13px] text-ink/70">
                <b className="text-ink">Client&apos;s worry:</b> {r.question}
              </p>
            )}

            {r.hasFile && (
              <a
                href={`/api/document-review/${r.id}/file`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:underline"
              >
                <Download className="h-4 w-4" aria-hidden="true" /> Open document
              </a>
            )}

            {r.status === 'assigned' ? (
              <>
                <p className="mt-2 text-[12px] text-ink/45">
                  Please send the report within {EXPERT_REVIEW_HOURS} hours of the client paying.
                </p>
                <ReportForm review={r} onSent={() => router.refresh()} />
              </>
            ) : r.status === 'delivered' ? (
              <details className="mt-3 text-[13px] text-ink/70">
                <summary className="flex cursor-pointer items-center gap-1.5 font-semibold text-emerald-700">
                  <CircleCheck className="h-4 w-4" /> Report sent {formatDate(r.deliveredAt)}
                </summary>
                <p className="mt-2 whitespace-pre-wrap">{r.report}</p>
              </details>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
