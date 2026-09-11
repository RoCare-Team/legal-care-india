'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Rows per page in the admin tables that page in the browser. */
export const PER_PAGE = 50;

/** Page numbers to show, with `null` for a gap — never more than seven slots. */
function pageWindow(page, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, null, totalPages];
  if (page >= totalPages - 3) return [1, null, ...Array.from({ length: 5 }, (_, i) => totalPages - 4 + i)];
  return [1, null, page - 1, page, page + 1, null, totalPages];
}

/**
 * Paging for an admin table that already holds its whole list and searches it
 * in the browser (Lawyers, Users).
 *
 * The URL-driven `Pagination` the other admin lists use re-renders the server
 * page on every click, which here would throw away what is typed in the search
 * box and any ticked rows. So a page is just a slice of the filtered list.
 *
 * Pass the filter values as `resetOn`: a new search or filter starts again at
 * page one, because page five of a list that just shrank to twelve rows is an
 * empty table.
 *
 * @param {Array} rows          the filtered list
 * @param {Array} resetOn       values that, when they change, go back to page one
 * @returns {{ page: number, totalPages: number, pageRows: Array, goToPage: (p: number) => void, topRef: object }}
 */
export function useClientPages(rows, resetOn = []) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const topRef = useRef(null);

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetOn);

  // A delete can shrink the list under the page being viewed.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageRows = useMemo(() => rows.slice((page - 1) * PER_PAGE, page * PER_PAGE), [rows, page]);

  const goToPage = (p) => {
    setPage(Math.min(Math.max(1, p), totalPages));
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return { page, totalPages, pageRows, goToPage, topRef };
}

/**
 * The controls: "Showing 51–100 of 396" and the page buttons.
 *
 * @param {object} props
 * @param {number} props.page
 * @param {number} props.totalPages
 * @param {number} props.total     rows across all pages
 * @param {(p: number) => void} props.onPage
 * @param {string} [props.label]   accessible name for the nav
 */
export default function ClientPager({ page, totalPages, total, onPage, label = 'Pages' }) {
  if (totalPages <= 1) return null;
  const from = (page - 1) * PER_PAGE + 1;
  const to = Math.min(page * PER_PAGE, total);
  const BOX = 'grid h-9 min-w-9 place-items-center rounded-lg px-2.5 text-sm font-semibold transition-colors';
  const idle = `${BOX} border border-ink/10 bg-surface text-ink/70 shadow-sm hover:border-primary/30 hover:text-primary`;
  const off = `${BOX} border border-ink/8 text-ink/25`;

  return (
    <nav className="mt-5 flex flex-col items-center gap-2.5 sm:flex-row sm:justify-between" aria-label={label}>
      <p className="text-xs text-ink/50">
        Showing <span className="font-semibold text-ink/70">{from}–{to}</span> of {total}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
          className={page === 1 ? off : idle}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        {pageWindow(page, totalPages).map((p, i) =>
          p === null ? (
            <span key={`gap-${i}`} className={`${BOX} text-ink/30`} aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPage(p)}
              aria-current={p === page ? 'page' : undefined}
              aria-label={`Page ${p}`}
              className={p === page ? `${BOX} bg-primary text-white shadow-sm` : idle}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          aria-label="Next page"
          className={page === totalPages ? off : idle}
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
