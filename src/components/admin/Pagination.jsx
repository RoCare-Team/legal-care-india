import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Page numbers to render, with `null` marking a gap. Always at most 7 slots. */
function pageWindow(page, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, null, totalPages];
  if (page >= totalPages - 3) return [1, null, ...Array.from({ length: 5 }, (_, i) => totalPages - 4 + i)];
  return [1, null, page - 1, page, page + 1, null, totalPages];
}

/**
 * Pagination — URL-driven page links for admin tables and lists.
 *
 * @param {object} props
 * @param {number} props.page        Current page, 1-based.
 * @param {number} props.totalPages
 * @param {string} props.basePath    Path the page links point at, e.g. '/admin/consultations'.
 * @param {number} [props.total]     Row count across all pages, for the summary line.
 * @param {number} [props.perPage]
 * @param {string} [props.param]     Query key, so several lists can paginate on one page.
 * @param {object} [props.extra]     Other query params to carry across page links.
 * @param {boolean} [props.compact]  Smaller controls, for use inside a card.
 * @param {string} [props.label]     Accessible name, needed when a page has more than one.
 */
export default function Pagination({
  page,
  totalPages,
  basePath,
  total,
  perPage,
  param = 'page',
  extra,
  compact = false,
  label = 'Pagination',
}) {
  if (totalPages <= 1) return null;

  const BOX = compact
    ? 'grid h-8 min-w-8 place-items-center rounded-lg px-2 text-xs font-semibold transition-colors'
    : 'grid h-9 min-w-9 place-items-center rounded-lg px-2.5 text-sm font-semibold transition-colors';
  const icon = compact ? 'h-3.5 w-3.5' : 'h-4 w-4';

  const href = (p) => {
    const qs = new URLSearchParams(extra || {});
    if (p === 1) qs.delete(param);
    else qs.set(param, String(p));
    const str = qs.toString();
    return str ? `${basePath}?${str}` : basePath;
  };
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  return (
    <nav
      className={`flex flex-col items-center gap-2 ${compact ? 'mt-4' : 'mt-6 gap-3'}`}
      aria-label={label}
    >
      <div className="flex items-center gap-1.5">
        {page > 1 ? (
          <Link
            href={href(page - 1)}
            rel="prev"
            aria-label="Previous page"
            className={`${BOX} border border-ink/10 bg-surface text-ink/70 shadow-sm hover:border-primary/30 hover:text-primary`}
          >
            <ChevronLeft className={icon} aria-hidden="true" />
          </Link>
        ) : (
          <span className={`${BOX} border border-ink/8 text-ink/25`} aria-hidden="true">
            <ChevronLeft className={icon} />
          </span>
        )}

        {pageWindow(page, totalPages).map((p, i) =>
          p === null ? (
            <span key={`gap-${i}`} className={`${BOX} text-ink/30`} aria-hidden="true">
              …
            </span>
          ) : p === page ? (
            <span key={p} aria-current="page" className={`${BOX} bg-primary text-white shadow-sm`}>
              {p}
            </span>
          ) : (
            <Link
              key={p}
              href={href(p)}
              aria-label={`Page ${p}`}
              className={`${BOX} border border-ink/10 bg-surface text-ink/70 shadow-sm hover:border-primary/30 hover:text-primary`}
            >
              {p}
            </Link>
          )
        )}

        {page < totalPages ? (
          <Link
            href={href(page + 1)}
            rel="next"
            aria-label="Next page"
            className={`${BOX} border border-ink/10 bg-surface text-ink/70 shadow-sm hover:border-primary/30 hover:text-primary`}
          >
            <ChevronRight className={icon} aria-hidden="true" />
          </Link>
        ) : (
          <span className={`${BOX} border border-ink/8 text-ink/25`} aria-hidden="true">
            <ChevronRight className={icon} />
          </span>
        )}
      </div>

      {typeof total === 'number' && typeof perPage === 'number' && (
        <p className="text-xs text-ink/50">
          Showing <span className="font-semibold text-ink/70">{from}–{to}</span> of {total}
        </p>
      )}
    </nav>
  );
}
