import { Check, FileText, HelpCircle, ChevronDown } from 'lucide-react';
import SectionReveal from '@/components/shared/SectionReveal';

/**
 * The long-form blocks a practice-area page is built from, each driven by
 * src/data/serviceContent.js. They are grouped here because they are only ever
 * used together, and because a page assembled from named blocks is easier to
 * reorder than one long file of JSX.
 */

/** Section heading with an optional lead line, shared by the blocks below. */
function SectionHead({ title, subtitle }) {
  return (
    <>
      <h2 className="font-display text-2xl font-bold text-ink">{title}</h2>
      {subtitle && <p className="mt-2 text-sm leading-relaxed text-ink/55">{subtitle}</p>}
    </>
  );
}

/**
 * "When you need a ... lawyer" — situations a visitor recognises as their own.
 * @param {{title:string, items:Array<{title:string,text:string}>}} props
 */
export function WhenToConsult({ title, items = [] }) {
  if (!items.length) return null;

  return (
    <SectionReveal>
      <section className="mt-16">
        <SectionHead
          title={title}
          subtitle="If any of these describe your situation, it is worth speaking to a lawyer early."
        />
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          {items.map(({ title: itemTitle, text }) => (
            <div
              key={itemTitle}
              className="flex gap-3.5 rounded-2xl border border-ink/8 bg-surface p-5 shadow-card"
            >
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/15">
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-[15px] font-semibold leading-snug text-ink">{itemTitle}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </SectionReveal>
  );
}

/**
 * "What a ... lawyer does for you" alongside the documents checklist — the two
 * sit in one band because each is a short list and neither fills a row alone.
 * @param {{title:string, does:string[], documents:string[]}} props
 */
export function WhatLawyerDoes({ title, does = [], documents = [] }) {
  if (!does.length && !documents.length) return null;

  return (
    <SectionReveal>
      <section className="mt-16 grid gap-6 lg:grid-cols-5">
        {does.length > 0 && (
          <div className="lg:col-span-3">
            <SectionHead title={title} />
            <ul className="mt-6 space-y-3.5">
              {does.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                  <span className="text-[15px] leading-relaxed text-ink/70">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {documents.length > 0 && (
          <div className="lg:col-span-2">
            <div className="h-full rounded-3xl border border-ink/8 bg-muted/40 p-6">
              <div className="flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-primary" aria-hidden="true" />
                <h3 className="font-display text-lg font-bold text-ink">Documents to keep ready</h3>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-ink/50">
                Bringing these to the first consultation saves a hearing later.
              </p>
              <ul className="mt-5 space-y-3">
                {documents.map((doc) => (
                  <li key={doc} className="flex gap-2.5 text-sm leading-relaxed text-ink/65">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary/60" aria-hidden="true" />
                    {doc}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>
    </SectionReveal>
  );
}

/**
 * "How the matter proceeds" — numbered steps on a connecting rail.
 * @param {{title:string, steps:Array<{title:string,text:string}>}} props
 */
export function ProcessSteps({ title, steps = [] }) {
  if (!steps.length) return null;

  return (
    <SectionReveal>
      <section className="mt-16">
        <SectionHead
          title={title}
          subtitle="Every matter differs, but most follow roughly this sequence."
        />
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <li key={step.title} className="relative">
              {/* Rail to the next step; hidden on the last card and on mobile. */}
              {i < steps.length - 1 && (
                <span
                  className="pointer-events-none absolute left-11 top-5 hidden h-px w-[calc(100%-1.75rem)] bg-gradient-to-r from-primary/25 to-transparent lg:block"
                  aria-hidden="true"
                />
              )}
              <span className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-dark font-display text-base font-bold text-white shadow-brand">
                {i + 1}
              </span>
              <h3 className="mt-4 text-[15px] font-semibold leading-snug text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/60">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </SectionReveal>
  );
}

/**
 * FAQ accordion. Previously duplicated inline in three separate views.
 * @param {{title:string, faqs:Array<{q:string,a:string}>}} props
 */
export function FaqList({ title, faqs = [] }) {
  if (!faqs.length) return null;

  return (
    <SectionReveal>
      <section className="mt-16">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-accent" aria-hidden="true" />
          <h2 className="font-display text-2xl font-bold text-ink">{title}</h2>
        </div>
        <div className="mt-7 space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-2xl border border-ink/8 bg-surface px-5 py-4 shadow-card transition-colors hover:border-primary/20 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-[15px] font-semibold text-ink">
                {faq.q}
                <ChevronDown
                  className="h-4 w-4 shrink-0 text-ink/40 transition-transform duration-300 group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-ink/65">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>
    </SectionReveal>
  );
}
