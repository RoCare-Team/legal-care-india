'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Loader2, ShieldAlert, FilePlus2, ListChecks, Lightbulb, FileText, Scale, Clock, CircleCheck, RotateCcw, Download,
  Check, Lock,
} from 'lucide-react';
import { RISK_META, EXPERT_STATUS, EXPERT_REVIEW_HOURS } from '@/constants/documentReview';

const SEVERITY = {
  high: 'border-red-200 bg-red-50/60',
  medium: 'border-amber-200 bg-amber-50/60',
  low: 'border-emerald-200 bg-emerald-50/60',
};
const DOT = { high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-emerald-500' };

function Block({ icon: Icon, title, children }) {
  return (
    <section className="rounded-2xl border border-ink/8 bg-white p-5 shadow-card sm:p-6">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
        <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function AiReport({ review }) {
  const ai = review.ai || {};
  const risk = RISK_META[ai.riskLevel];
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-ink/8 bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11.5px] font-bold uppercase tracking-wide text-ink/45">AI review</p>
            <h1 className="mt-1 font-display text-2xl font-bold text-ink">{ai.documentType || review.fileName}</h1>
          </div>
          {risk && (
            <span className={`rounded-full px-3 py-1.5 text-[13px] font-bold ring-1 ${risk.tone}`}>{risk.label}</span>
          )}
        </div>
        <p className="mt-3 text-[14.5px] leading-relaxed text-ink/70">{ai.summary}</p>
      </section>

      {ai.redFlags?.length > 0 && (
        <Block icon={ShieldAlert} title={`Red flags (${ai.redFlags.length})`}>
          <ul className="space-y-3">
            {ai.redFlags.map((f, i) => (
              <li key={i} className={`rounded-xl border p-4 ${SEVERITY[f.severity] || SEVERITY.medium}`}>
                <p className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[f.severity] || DOT.medium}`} />
                  {f.title}
                  <span className="ml-auto text-[11px] font-bold uppercase text-ink/40">{f.severity}</span>
                </p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-ink/65">{f.detail}</p>
              </li>
            ))}
          </ul>
        </Block>
      )}

      {ai.missingClauses?.length > 0 && (
        <Block icon={FilePlus2} title="Missing clauses">
          <ul className="space-y-3">
            {ai.missingClauses.map((f, i) => (
              <li key={i} className="border-l-2 border-accent pl-3.5">
                <p className="text-[14px] font-semibold text-ink">{f.title}</p>
                <p className="mt-0.5 text-[13.5px] text-ink/60">{f.detail}</p>
              </li>
            ))}
          </ul>
        </Block>
      )}

      {ai.keyTerms?.length > 0 && (
        <Block icon={ListChecks} title="Key terms">
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {ai.keyTerms.map((t, i) => (
              <div key={i} className="rounded-xl bg-muted/50 px-3.5 py-2.5">
                <dt className="text-[11.5px] font-bold uppercase tracking-wide text-ink/45">{t.label}</dt>
                <dd className="mt-0.5 text-[14px] font-medium text-ink">{t.value}</dd>
              </div>
            ))}
          </dl>
        </Block>
      )}

      {ai.suggestions?.length > 0 && (
        <Block icon={Lightbulb} title="What you should do next">
          <ol className="list-decimal space-y-2 pl-5 text-[14px] leading-relaxed text-ink/70">
            {ai.suggestions.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
        </Block>
      )}

      <div className="rounded-2xl border border-accent/40 bg-accent/[0.07] p-5 sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div>
          <p className="font-semibold text-ink">Something here worries you?</p>
          <p className="mt-0.5 text-[13.5px] text-ink/60">
            This is an AI first read, not legal advice. A lawyer can read it properly and tell you what to do.
          </p>
        </div>
        <div className="mt-3 flex shrink-0 gap-2 sm:mt-0">
          <Link href="/document-review#start" className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-dark">
            Lawyer review
          </Link>
          <Link href="/lawyers" className="inline-flex h-10 items-center rounded-xl border border-ink/15 px-4 text-sm font-semibold text-ink hover:border-primary">
            Talk to a lawyer
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * ExpertProgress — where a lawyer review has got to, as four steps: paid,
 * a lawyer assigned by the Justiceland team, the lawyer reviewing, report ready.
 */
function ExpertProgress({ review }) {
  const at = { paid: 1, assigned: 2, delivered: 4 }[review.status] ?? 1;
  const steps = [
    { title: 'Payment received', sub: review.paidAt ? formatWhen(review.paidAt) : '' },
    {
      title: 'Lawyer assigned',
      sub: review.advocateName ? review.advocateName : 'Our team picks a verified lawyer for this area of law',
    },
    { title: 'Lawyer reviewing', sub: 'Reading every clause and your worry' },
    { title: 'Report ready', sub: `Within ${EXPERT_REVIEW_HOURS} hours of payment` },
  ];
  return (
    <section className="rounded-2xl border border-ink/8 bg-white p-5 shadow-card sm:p-6">
      <h2 className="font-display text-lg font-bold text-ink">
        {review.status === 'delivered' ? 'Review complete' : 'Your review is on its way'}
      </h2>
      <ol className="mt-5 grid gap-4 sm:grid-cols-4 sm:gap-2">
        {steps.map((st, i) => {
          const done = i < at;
          const active = i === at;
          return (
            <li key={st.title} className="relative flex gap-3 sm:flex-col sm:gap-2">
              {i < steps.length - 1 && (
                <span
                  className={`absolute left-[13px] top-7 h-[calc(100%-4px)] w-0.5 sm:left-7 sm:top-[13px] sm:h-0.5 sm:w-[calc(100%-1.5rem)] ${i + 1 <= at ? 'bg-emerald-500' : 'bg-ink/10'}`}
                  aria-hidden="true"
                />
              )}
              <span
                className={`relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full ${
                  done ? 'bg-emerald-500 text-white' : active ? 'bg-accent/25 text-[#9A7B1C] ring-4 ring-accent/15' : 'bg-ink/[0.07] text-ink/35'
                }`}
              >
                {done ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" /> : active ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <span className="text-[11px] font-bold">{i + 1}</span>}
              </span>
              <span className="min-w-0 sm:pr-3">
                <span className={`block text-[13.5px] font-semibold ${done || active ? 'text-ink' : 'text-ink/40'}`}>{st.title}</span>
                <span className="block text-[12px] leading-snug text-ink/50">{st.sub}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function formatWhen(iso) {
  try {
    return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

function ExpertReport({ review }) {
  const meta = EXPERT_STATUS[review.status] || EXPERT_STATUS.paid;
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-ink/8 bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11.5px] font-bold uppercase tracking-wide text-ink/45">Lawyer review</p>
            <h1 className="mt-1 font-display text-2xl font-bold text-ink">{review.fileName}</h1>
            <p className="mt-1 text-[13px] text-ink/50">
              {review.pages} page{review.pages === 1 ? '' : 's'} · {review.areaLabel} · ₹{review.amount.toLocaleString('en-IN')} paid
            </p>
          </div>
          <span className={`rounded-full px-3 py-1.5 text-[12.5px] font-bold ${meta.tone}`}>{meta.label}</span>
        </div>
        {review.hasFile && (
          <a
            href={`/api/document-review/${review.id}/file`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:underline"
          >
            <Download className="h-4 w-4" aria-hidden="true" /> Your document
          </a>
        )}
        {review.question && (
          <p className="mt-4 rounded-xl bg-muted/50 px-4 py-3 text-[13.5px] text-ink/70">
            <b className="text-ink">Your worry:</b> {review.question}
          </p>
        )}
      </section>

      {review.status !== 'cancelled' && <ExpertProgress review={review} />}

      {review.status === 'delivered' ? (
        <Block icon={Scale} title={`Report${review.advocateName ? ` by ${review.advocateName}` : ''}`}>
          <div className="whitespace-pre-wrap text-[14.5px] leading-relaxed text-ink/80">{review.report}</div>
        </Block>
      ) : review.status === 'cancelled' ? (
        <Block icon={Clock} title="This review was cancelled">
          <p className="text-[14px] text-ink/65">{review.adminNote || 'Your payment will be refunded.'}</p>
        </Block>
      ) : null}
    </div>
  );
}

/** What the AI is doing, in order. Timed, not reported — the read is one call. */
const SCAN_STEPS = [
  'Payment confirmed',
  'Reading every page',
  'Checking clauses for risks',
  'Looking for missing clauses',
  'Writing your report',
];

/**
 * ScanningView — shown from payment until the report is ready: the document
 * with a scanner line moving over it, and the steps ticking off beside it.
 * The last step stays in progress until the report actually arrives, so it
 * never claims to be done before it is.
 */
function ScanningView({ review }) {
  const confirming = !review || review.status === 'pending';
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (confirming) return undefined;
    const t = setInterval(() => setStep((n) => Math.min(n + 1, SCAN_STEPS.length - 1)), 2600);
    return () => clearInterval(t);
  }, [confirming]);

  const current = confirming ? 0 : step;
  const pct = Math.round(((current + (confirming ? 0.3 : 0.6)) / SCAN_STEPS.length) * 100);

  return (
    <div className="overflow-hidden rounded-3xl border border-ink/8 bg-white shadow-card">
      <div className="grid gap-8 p-6 sm:grid-cols-[13rem_minmax(0,1fr)] sm:p-8">
        {/* The document being scanned. */}
        <div className="relative mx-auto h-64 w-48 overflow-hidden rounded-xl border border-ink/10 bg-gradient-to-b from-white to-muted/60 p-4 shadow-[0_18px_40px_-24px_rgba(30,58,95,0.45)] sm:mx-0">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-rose-50 text-rose-600">
              <FileText className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="truncate text-[11px] font-semibold text-ink/70">{review?.fileName || 'Your document'}</span>
          </div>
          <div className="mt-4 space-y-2" aria-hidden="true">
            {[92, 80, 96, 70, 88, 60, 94, 76, 84, 52, 90, 68].map((w, i) => (
              <span key={i} className="block h-1.5 rounded-full bg-ink/[0.08]" style={{ width: `${w}%` }} />
            ))}
          </div>
          {!confirming && (
            <>
              <span className="pointer-events-none absolute inset-x-0 h-[3px] animate-scan bg-gradient-to-r from-transparent via-accent to-transparent shadow-[0_0_16px_4px_rgba(212,175,55,0.55)]" />
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-accent/[0.04] via-transparent to-accent/[0.04]" />
            </>
          )}
        </div>

        {/* What is happening. */}
        <div>
          <p className="text-[11.5px] font-bold uppercase tracking-[0.16em] text-[#9A7B1C]">
            {confirming ? 'Almost there' : 'AI review in progress'}
          </p>
          <h1 className="mt-1.5 font-display text-2xl font-bold text-ink">
            {confirming ? 'Confirming your payment…' : 'Scanning your document'}
          </h1>
          <p className="mt-1.5 text-[14px] text-ink/55">
            Usually under 2 minutes. Keep this page open — your report appears here.
          </p>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-ink/[0.07]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#B8912A] to-[#D4AF37] transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>

          <ol className="mt-5 space-y-3">
            {SCAN_STEPS.map((label, i) => {
              const done = i < current;
              const active = i === current;
              return (
                <li key={label} className="flex items-center gap-3">
                  <span
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-full transition-colors ${
                      done ? 'bg-emerald-500 text-white' : active ? 'bg-accent/20 text-[#9A7B1C]' : 'bg-ink/[0.06] text-ink/30'
                    }`}
                  >
                    {done ? (
                      <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
                    ) : active ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    )}
                  </span>
                  <span className={`text-[14px] ${done ? 'text-ink/70' : active ? 'font-semibold text-ink' : 'text-ink/35'}`}>
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
      <p className="flex items-center justify-center gap-1.5 border-t border-ink/[0.06] bg-muted/30 px-6 py-3 text-[12px] text-ink/50">
        <Lock className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
        Your document is encrypted and deleted once the review is done.
      </p>
    </div>
  );
}

/**
 * ReviewResult — one review, as the client sees it. Straight after paying it
 * shows progress while the payment is confirmed and the AI reads the file,
 * polling until there is something to show.
 */
export default function ReviewResult({ id }) {
  const [review, setReview] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/document-review/${id}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not load this review.');
        return null;
      }
      setReview(data.review);
      return data.review;
    } catch {
      setError('Could not reach the server.');
      return null;
    }
  }, [id]);

  useEffect(() => {
    let stop = false;
    let t;
    const tick = async () => {
      const r = await load();
      if (stop) return;
      const waiting = !r || r.status === 'pending' || (r.kind === 'ai' && r.status === 'paid' && !r.ai?.error);
      if (waiting) t = setTimeout(tick, 3000);
    };
    tick();
    return () => { stop = true; clearTimeout(t); };
  }, [load]);

  if (error) {
    return <p className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700">{error}</p>;
  }

  const working = !review || review.status === 'pending' || (review.kind === 'ai' && review.status === 'paid');
  if (working && review?.ai?.error) {
    return (
      <div className="rounded-3xl border border-ink/8 bg-white px-6 py-16 text-center shadow-card">
        <p className="font-display text-xl font-bold text-ink">{review.ai.error}</p>
        <button
          type="button"
          onClick={() => { setReview(null); load(); }}
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" /> Try again
        </button>
      </div>
    );
  }
  if (working) return <ScanningView review={review} />;

  return (
    <div>
      <p className="mb-4 flex items-center gap-1.5 text-[13px] font-semibold text-emerald-700">
        <CircleCheck className="h-4 w-4" aria-hidden="true" /> Paid · saved in your account under Document reviews
      </p>
      {review.kind === 'ai' ? <AiReport review={review} /> : <ExpertReport review={review} />}
    </div>
  );
}
