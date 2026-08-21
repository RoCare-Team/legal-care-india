'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Copy, Check, Loader2, RefreshCw, Radio, ChevronRight } from 'lucide-react';
import DataTable, { AdminAvatar } from '@/components/admin/DataTable';
import { SearchBox } from '@/components/admin/TableControls';
import Pagination from '@/components/admin/Pagination';
import { formatDate } from '@/utils/formatters';

/** ₹ with Indian grouping, no decimals — every amount here is whole rupees. */
function money(value = 0) {
  return `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

/** Click-to-copy id, shown in a monospace pill. Ids are long and easy to mistype. */
function CopyId({ value }) {
  const [copied, setCopied] = useState(false);
  if (!value) return <span className="text-ink/30">—</span>;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — the id is still readable on screen */
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      title={`Copy ${value}`}
      className="group inline-flex max-w-[13rem] items-center gap-1.5 rounded-lg bg-ink/5 px-2 py-1 font-mono text-xs text-ink/70 transition-colors hover:bg-primary/10 hover:text-primary"
    >
      <span className="truncate">{value}</span>
      {copied ? (
        <Check className="h-3 w-3 shrink-0 text-emerald-600" aria-hidden="true" />
      ) : (
        <Copy className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
      )}
    </button>
  );
}

const LIVE_STATUS_STYLES = {
  captured: 'bg-emerald-500/10 text-emerald-700',
  authorized: 'bg-amber-500/10 text-amber-700',
  failed: 'bg-red-500/10 text-red-600',
  refunded: 'bg-violet-500/10 text-violet-700',
  created: 'bg-ink/8 text-ink/55',
};

/**
 * PaymentsTable — every wallet top-up that came through Razorpay.
 *
 * Two views of the same money. The table is our own ledger: what actually
 * reached a wallet, tied to the user it belongs to. The "Live from Razorpay"
 * panel is the gateway's own record, fetched on demand, and it also shows the
 * failed and pending attempts our database never hears about — which is what
 * you need when someone reports money taken but no balance.
 *
 * @param {object} props
 * @param {Array}  props.payments  page of rows from adminGetPayments
 * @param {object} props.meta      { page, totalPages, total, perPage, search }
 */
export default function PaymentsTable({ payments, meta }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const [search, setSearch] = useState(meta.search || '');
  const [live, setLive] = useState(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState('');

  // Search is server-side — the ledger can grow past what is sensible to ship
  // to the browser — so it travels through the URL, like the page number.
  const runSearch = (value) => {
    setSearch(value);
    startTransition(() => {
      const qs = new URLSearchParams();
      if (value.trim()) qs.set('q', value.trim());
      const str = qs.toString();
      router.replace(str ? `${pathname}?${str}` : pathname, { scroll: false });
    });
  };

  const loadLive = async () => {
    setLiveLoading(true);
    setLiveError('');
    try {
      const res = await fetch('/api/admin/payments/live');
      const data = await res.json();
      if (!res.ok) {
        setLiveError(data.error || 'Could not load payments from Razorpay.');
        return;
      }
      setLive(data.payments || []);
    } catch {
      setLiveError('Could not reach the server.');
    } finally {
      setLiveLoading(false);
    }
  };

  const columns = [
    {
      key: 'user',
      label: 'User',
      render: (r) => (
        <Link href={`/admin/users/${r.userId}`} className="group flex items-center gap-3">
          <AdminAvatar name={r.name || r.phone || '?'} />
          <span className="min-w-0">
            <span className="block truncate font-medium text-ink group-hover:text-primary">
              {r.name || 'Unnamed'}
            </span>
            <span className="block truncate text-xs text-ink/45">{r.email || r.phone || '—'}</span>
          </span>
        </Link>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (r) => (
        <span className="font-semibold text-emerald-600">+{money(r.amount)}</span>
      ),
    },
    { key: 'paymentId', label: 'Payment ID', render: (r) => <CopyId value={r.paymentId} /> },
    { key: 'orderId', label: 'Order ID', render: (r) => <CopyId value={r.orderId} /> },
    {
      key: 'createdAt',
      label: 'Date',
      render: (r) => <span className="whitespace-nowrap text-ink/60">{formatDate(r.createdAt)}</span>,
    },
    {
      key: 'open',
      label: '',
      render: (r) => (
        <Link
          href={`/admin/users/${r.userId}`}
          aria-label="Open user"
          className="grid h-8 w-8 place-items-center rounded-lg text-ink/35 transition-colors hover:bg-primary/10 hover:text-primary"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchBox
          value={search}
          onChange={runSearch}
          placeholder="Search name, email, phone, payment or order ID…"
        />
        {pending && <Loader2 className="h-4 w-4 animate-spin text-ink/40" aria-hidden="true" />}
      </div>

      <DataTable
        columns={columns}
        rows={payments}
        empty={
          meta.search
            ? 'No payment matches that search.'
            : 'No Razorpay payments yet. Top-ups will appear here as they happen.'
        }
      />

      <Pagination
        page={meta.page}
        totalPages={meta.totalPages}
        total={meta.total}
        perPage={meta.perPage}
        basePath="/admin/payments"
        extra={meta.search ? { q: meta.search } : undefined}
        label="Payments pagination"
      />

      {/* ── The gateway's own record ─────────────────────────────────────── */}
      <section className="mt-10 rounded-2xl border border-ink/8 bg-surface p-5 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-600">
              <Radio className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-display text-lg font-semibold text-ink">Live from Razorpay</h3>
              <p className="mt-0.5 text-sm text-ink/55">
                The last 50 payments as Razorpay sees them — including the failed ones,
                which never reach the table above.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadLive}
            disabled={liveLoading}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-ink/12 px-4 text-sm font-semibold text-ink/70 transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-60"
          >
            {liveLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {live ? 'Refresh' : 'Load'}
          </button>
        </div>

        {liveError && <p className="mt-4 text-sm text-red-600">{liveError}</p>}

        {live && (
          <div className="mt-4">
            <DataTable
              maxHeight="28rem"
              rows={live}
              rowKey={(r) => r.id}
              empty="Razorpay has no payments on this account yet."
              columns={[
                {
                  key: 'status',
                  label: 'Status',
                  render: (r) => (
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                        LIVE_STATUS_STYLES[r.status] || 'bg-ink/8 text-ink/55'
                      }`}
                    >
                      {r.status}
                    </span>
                  ),
                },
                {
                  key: 'amount',
                  label: 'Amount',
                  render: (r) => <span className="font-semibold text-ink">{money(r.amount)}</span>,
                },
                {
                  key: 'method',
                  label: 'Method',
                  render: (r) => <span className="uppercase text-xs text-ink/60">{r.method || '—'}</span>,
                },
                {
                  key: 'contact',
                  label: 'Paid by',
                  render: (r) => (
                    <span className="block min-w-0">
                      <span className="block truncate text-ink/75">{r.email || '—'}</span>
                      <span className="block truncate text-xs text-ink/45">{r.contact || ''}</span>
                    </span>
                  ),
                },
                { key: 'id', label: 'Payment ID', render: (r) => <CopyId value={r.id} /> },
                {
                  key: 'createdAt',
                  label: 'Date',
                  render: (r) => (
                    <span className="whitespace-nowrap text-ink/60">{formatDate(r.createdAt)}</span>
                  ),
                },
                {
                  key: 'errorReason',
                  label: 'Reason',
                  render: (r) =>
                    r.errorReason ? (
                      <span className="text-xs text-red-600">{r.errorReason}</span>
                    ) : (
                      <span className="text-ink/30">—</span>
                    ),
                },
              ]}
            />
          </div>
        )}
      </section>
    </div>
  );
}
