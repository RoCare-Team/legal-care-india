'use client';

import { useState } from 'react';
import { Sparkles, Scale, Check, X } from 'lucide-react';
import {
  AI_REVIEW_FEE, AI_MAX_PAGES, LAWYER_RATE, LAWYER_RATE_LONG, LAWYER_LONG_FROM, EXPERT_REVIEW_HOURS,
  lawyerReviewPrice,
} from '@/constants/documentReview';

const rupees = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

const choose = (kind) => window.dispatchEvent(new CustomEvent('review:choose', { detail: kind }));

function Feature({ ok = true, children }) {
  return (
    <li className={`flex items-start gap-2 text-[13.5px] ${ok ? 'text-ink/75' : 'text-ink/35'}`}>
      {ok ? (
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
      ) : (
        <X className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      )}
      {children}
    </li>
  );
}

/**
 * ReviewPlans — the two reviews side by side, with what each includes and
 * what it does not. The lawyer card carries a page slider so the price of a
 * real document can be seen before uploading it. Only what the product does
 * is listed; nothing is promised here that the review does not deliver.
 */
export default function ReviewPlans() {
  const [pages, setPages] = useState(6);
  const total = lawyerReviewPrice(pages);
  const long = pages >= LAWYER_LONG_FROM;

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
      {/* AI */}
      <div className="relative flex flex-col rounded-3xl border border-ink/10 bg-white p-7">
        <span className="absolute -top-3 left-7 rounded-full bg-primary px-3 py-1 text-[10.5px] font-bold uppercase tracking-wide text-white">
          Fastest
        </span>
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/[0.08] text-primary">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </span>
        <h3 className="mt-4 font-display text-xl font-bold text-ink">AI Document Review</h3>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink/60">
          AI reads every clause and tells you what&apos;s risky, missing or one-sided — in plain English.
        </p>
        <p className="mt-5 font-display text-4xl font-bold text-ink">
          {rupees(AI_REVIEW_FEE)} <span className="font-sans text-[14px] font-medium text-ink/50">flat, any document</span>
        </p>
        <p className="mt-1 text-[12.5px] text-ink/45">Same price for 2 pages or {AI_MAX_PAGES}.</p>

        <ul className="mt-6 flex-1 space-y-2.5">
          <Feature>Risk rating for the whole document in about 2 minutes</Feature>
          <Feature>Red flags, each with a plain-English reason</Feature>
          <Feature>Missing clauses a document like this should have</Feature>
          <Feature>Key terms pulled out — amounts, dates, notice periods</Feature>
          <Feature>What to ask to change before you sign</Feature>
          <Feature ok={false}>No lawyer signature or legal opinion</Feature>
        </ul>

        <button
          type="button"
          onClick={() => choose('ai')}
          className="mt-7 h-12 rounded-xl bg-primary text-[15px] font-bold text-white transition-colors hover:bg-primary-dark"
        >
          Start AI review — {rupees(AI_REVIEW_FEE)}
        </button>
        <p className="mt-2.5 text-center text-[12px] text-ink/45">Best for rent agreements, offer letters, NDAs, quick checks</p>
      </div>

      {/* Lawyer */}
      <div className="relative flex flex-col rounded-3xl border-2 border-accent bg-white p-7 shadow-[0_24px_50px_-28px_rgba(212,175,55,0.65)]">
        <span className="absolute -top-3 left-7 rounded-full bg-gradient-to-r from-[#B8912A] to-[#D4AF37] px-3 py-1 text-[10.5px] font-bold uppercase tracking-wide text-primary-dark">
          Most trusted
        </span>
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent/15 text-[#9A7B1C]">
          <Scale className="h-5 w-5" aria-hidden="true" />
        </span>
        <h3 className="mt-4 font-display text-xl font-bold text-ink">Lawyer Review</h3>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink/60">
          A verified advocate practising in your area of law reads the document and writes you a proper opinion.
        </p>
        <p className="mt-5 font-display text-4xl font-bold text-ink">
          {rupees(LAWYER_RATE)} <span className="font-sans text-[14px] font-medium text-ink/50">/ page</span>
        </p>
        <p className="mt-1 text-[12.5px] text-ink/45">
          Drops to {rupees(LAWYER_RATE_LONG)}/page once your document reaches {LAWYER_LONG_FROM} pages.
        </p>

        {/* Price calculator */}
        <div className="mt-5 rounded-2xl border border-ink/8 bg-muted/40 p-4">
          <div className="flex items-center justify-between text-[13px]">
            <label htmlFor="pages" className="font-semibold text-ink">How many pages?</label>
            <span className="font-bold text-ink">{pages} page{pages === 1 ? '' : 's'}</span>
          </div>
          <input
            id="pages"
            type="range"
            min={1}
            max={40}
            value={pages}
            onChange={(e) => setPages(Number(e.target.value))}
            className="mt-3 w-full accent-[#B8912A]"
          />
          <div className="mt-2 flex items-end justify-between">
            <span className="font-display text-2xl font-bold text-ink">{rupees(total)}</span>
            <span className="text-[12px] text-ink/50">
              {pages} × {rupees(long ? LAWYER_RATE_LONG : LAWYER_RATE)}/page
            </span>
          </div>
          {long && (
            <p className="mt-2 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-[12px] font-semibold text-emerald-700">
              {LAWYER_LONG_FROM}+ pages — every page at {rupees(LAWYER_RATE_LONG)}
            </p>
          )}
        </div>

        <ul className="mt-6 flex-1 space-y-2.5">
          <Feature>Line-by-line review by a Bar-verified lawyer, not a template</Feature>
          <Feature>Written opinion on what to change before you sign</Feature>
          <Feature>Answers the specific worry you tell us about</Feature>
          <Feature>Report in your account within {EXPERT_REVIEW_HOURS} hours</Feature>
          <Feature>Follow up with a lawyer on chat or call if you need more</Feature>
        </ul>

        <button
          type="button"
          onClick={() => choose('expert')}
          className="mt-7 h-12 rounded-xl bg-gradient-to-r from-[#B8912A] via-[#D4AF37] to-[#B8912A] text-[15px] font-bold text-primary-dark shadow-gold transition-opacity hover:opacity-95"
        >
          Get a lawyer review
        </button>
        <p className="mt-2.5 text-center text-[12px] text-ink/45">
          Best for property papers, business contracts, legal notices — anything you&apos;d regret signing
        </p>
      </div>
    </div>
  );
}
