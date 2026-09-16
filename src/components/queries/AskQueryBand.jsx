'use client';

import { MessageSquareText, ArrowRight } from 'lucide-react';
import { openAskQuery } from '@/utils/askQuery';
import { cn } from '@/utils/cn';

/**
 * A one-line "not sure which lawyer?" strip for pages that list lawyers. It
 * opens the ask popup with the page's topic and city already filled in, for the
 * visitor who would rather describe the problem than compare profiles.
 *
 * @param {object} props
 * @param {string} [props.category]  practice area or matter this page is about
 * @param {string} [props.city]
 * @param {string} [props.className]
 */
export default function AskQueryBand({ category = '', city = '', className }) {
  const topic = category ? `${category.replace(/ Law$/, '').toLowerCase()} problem` : 'legal problem';

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-3xl border border-accent/35 bg-accent/[0.07] p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5',
        className
      )}
    >
      <span className="hidden h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent/20 text-primary-dark sm:grid">
        <MessageSquareText className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold text-ink">Not sure which lawyer to pick?</p>
        <p className="mt-0.5 text-sm text-ink/60">
          Just tell us your {topic}{city ? ` in ${city}` : ''}. A verified lawyer will call you — free, no login.
        </p>
      </div>
      <button
        type="button"
        onClick={() => openAskQuery({ category, city, source: 'band' })}
        className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-brand transition-colors hover:bg-primary-dark"
      >
        Describe my problem
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
