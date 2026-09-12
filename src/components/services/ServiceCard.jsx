import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';

/**
 * ServiceCard — one fixed-price service in the catalogue.
 *
 * A service is bought on its price and its scope, so those are what the card
 * leads with: what it is, what it costs, and how long it takes. The saving is
 * shown only when there is one — `serializeService` drops an MRP that is not
 * genuinely above the price, so a struck-through figure here always means a
 * real discount.
 *
 * Every price on this site is quoted before GST, the same as the lawyer plans,
 * and the card says so rather than letting the total surprise anyone later.
 *
 * @param {object} props
 * @param {object} props.service  a card record from lib/legalServices
 */
export default function ServiceCard({ service }) {
  const { slug, title, category, summary, price, mrp, discountPercent, turnaround } = service;

  return (
    <Link
      href={`/services/${slug}`}
      className="group relative flex h-full flex-col rounded-2xl border border-ink/8 bg-surface p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-card-hover"
    >
      {discountPercent > 0 && (
        <span className="absolute right-4 top-4 rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-bold text-amber-700">
          {discountPercent}% OFF
        </span>
      )}

      {category && (
        <span className="inline-flex w-fit rounded-lg bg-primary/[0.07] px-2.5 py-1 text-[11.5px] font-semibold text-primary">
          {category}
        </span>
      )}

      <h3 className="mt-3 pr-16 font-display text-[17px] font-bold leading-snug text-ink transition-colors group-hover:text-primary">
        {title}
      </h3>

      {summary && (
        <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-relaxed text-ink/60">{summary}</p>
      )}

      {turnaround && (
        <p className="mt-3 flex items-center gap-1.5 text-[12.5px] text-ink/55">
          <Clock className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
          <span className="line-clamp-1">{turnaround}</span>
        </p>
      )}

      <div className="mt-auto flex items-end justify-between gap-3 border-t border-ink/[0.07] pt-4">
        <div className="min-w-0">
          <p className="flex items-baseline gap-2">
            <span className="font-display text-[22px] font-bold text-ink">
              ₹{price.toLocaleString('en-IN')}
            </span>
            {mrp > 0 && (
              <span className="text-[13px] text-ink/40 line-through">
                ₹{mrp.toLocaleString('en-IN')}
              </span>
            )}
          </p>
          <p className="mt-0.5 text-[11.5px] text-ink/45">+ GST</p>
        </div>

        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/[0.07] px-3 py-2 text-[12.5px] font-semibold text-primary transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-white">
          View details
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
