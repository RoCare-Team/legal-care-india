import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import SectionReveal from '@/components/shared/SectionReveal';

/**
 * The grid of specific matters under a practice area.
 *
 * Each card carries the matter's own one-line description and how many lawyers
 * actually handle it, so a visitor can tell what is behind a card before
 * clicking. The earlier version showed a bare label and an arrow, which made
 * twelve very different matters look identical.
 *
 * @param {object} props
 * @param {string} props.title
 * @param {string} [props.subtitle]
 * @param {Array<{name:string, slug:string, description?:string}>} props.matters
 * @param {(matter:object) => string} props.hrefFor
 * @param {(matter:object) => number} [props.countFor]  lawyers handling it
 */
export default function MatterGrid({ title, subtitle, matters, hrefFor, countFor }) {
  if (!matters?.length) return null;

  return (
    <SectionReveal>
      <section className="mt-16">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" aria-hidden="true" />
          <h2 className="font-display text-2xl font-bold text-ink">{title}</h2>
        </div>
        {subtitle && <p className="mt-2 text-sm leading-relaxed text-ink/55">{subtitle}</p>}

        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matters.map((matter) => {
            const count = countFor ? countFor(matter) : null;
            return (
              <Link
                key={matter.slug}
                href={hrefFor(matter)}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink/8 bg-surface p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-card-hover"
              >
                {/* Gold hairline that draws itself along the top on hover. */}
                <span
                  className="pointer-events-none absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-accent to-primary transition-transform duration-300 group-hover:scale-x-100"
                  aria-hidden="true"
                />

                <h3 className="pr-6 font-display text-base font-bold leading-snug text-ink transition-colors group-hover:text-primary">
                  {matter.name}
                </h3>

                {matter.description && (
                  <p className="mt-2 text-[13px] leading-relaxed text-ink/55">
                    {matter.description}
                  </p>
                )}

                <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                  <span className="text-xs font-semibold text-ink/40">
                    {count === null
                      ? 'View lawyers'
                      : count > 0
                        ? `${count} ${count === 1 ? 'lawyer' : 'lawyers'}`
                        : 'No lawyers yet'}
                  </span>
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/[0.06] text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <ArrowRight
                      className="h-3.5 w-3.5 transition-transform group-hover:translate-x-px"
                      aria-hidden="true"
                    />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </SectionReveal>
  );
}
