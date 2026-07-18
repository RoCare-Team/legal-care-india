import Link from 'next/link';
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Scale, User as UserIcon } from 'lucide-react';
import { formatDate } from '@/utils/formatters';

/** Colour + label for each consultation status (shared across admin). */
export const CONSULT_STATUS_META = {
  pending: { label: 'Pending', tone: 'bg-amber-500/10 text-amber-600' },
  active: { label: 'Active', tone: 'bg-emerald-500/10 text-emerald-600' },
  ended: { label: 'Ended', tone: 'bg-slate-500/10 text-slate-600' },
  rejected: { label: 'Rejected', tone: 'bg-rose-500/10 text-rose-600' },
  cancelled: { label: 'Cancelled', tone: 'bg-ink/10 text-ink/50' },
};

/** "← Back to …" link at the top of a detail page. */
export function DetailBack({ href, label }) {
  return (
    <Link href={href} className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink/55 transition-colors hover:text-primary">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {label}
    </Link>
  );
}

/** A titled panel that groups related fields. */
export function InfoCard({ title, action, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-ink/8 bg-surface p-5 shadow-card ${className}`}>
      {title && (
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink/40">{title}</h3>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** A single label → value line inside an InfoCard. */
export function InfoRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-ink/6 py-2.5 last:border-0">
      <span className="shrink-0 text-sm text-ink/50">{label}</span>
      <span className="text-right text-sm font-medium text-ink/85">{children || <span className="text-ink/30">—</span>}</span>
    </div>
  );
}

/** A big number tile for a headline stat. */
export function StatTile({ label, value, tone = 'text-ink' }) {
  return (
    <div className="rounded-2xl border border-ink/8 bg-surface p-4 shadow-card">
      <p className={`font-display text-2xl font-bold ${tone}`}>{value}</p>
      <p className="mt-0.5 text-xs text-ink/50">{label}</p>
    </div>
  );
}

/** A pill for a consultation status. */
export function ConsultStatusPill({ status }) {
  const meta = CONSULT_STATUS_META[status] || CONSULT_STATUS_META.pending;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.tone}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {meta.label}
    </span>
  );
}

/**
 * List of consultations. `perspective` decides which counterparty name to show:
 * 'user' page shows the advocate, 'advocate' page shows the client.
 */
export function ConsultationList({ items, perspective = 'user', empty = 'No consultations yet.' }) {
  if (!items || items.length === 0) {
    return <p className="py-6 text-center text-sm text-ink/45">{empty}</p>;
  }
  const Icon = perspective === 'user' ? Scale : UserIcon;
  return (
    <ul className="divide-y divide-ink/6">
      {items.map((c) => {
        const other = perspective === 'user' ? c.advocateName : c.userName;
        return (
          <li key={c.id} className="flex items-center justify-between gap-3 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <Icon className="h-4 w-4 shrink-0 text-ink/35" aria-hidden="true" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{other}</p>
                <p className="text-xs text-ink/45">
                  {c.minutes} min · {c.messagesCount} msgs · {formatDate(c.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-sm font-semibold text-ink">
                {c.charged ? `₹${c.price}` : <span className="text-ink/35">₹{c.price}</span>}
              </span>
              <ConsultStatusPill status={c.status} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Wallet ledger list (credits green, debits rose). */
export function WalletList({ items, empty = 'No transactions yet.' }) {
  if (!items || items.length === 0) {
    return <p className="py-6 text-center text-sm text-ink/45">{empty}</p>;
  }
  return (
    <ul className="divide-y divide-ink/6">
      {items.map((t) => {
        const credit = t.type === 'credit';
        return (
          <li key={t.id} className="flex items-center justify-between gap-3 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${credit ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                {credit ? <ArrowDownLeft className="h-4 w-4" aria-hidden="true" /> : <ArrowUpRight className="h-4 w-4" aria-hidden="true" />}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink/80">{t.note || (credit ? 'Credit' : 'Debit')}</p>
                <p className="text-xs text-ink/45">{formatDate(t.createdAt)}</p>
              </div>
            </div>
            <span className={`shrink-0 text-sm font-semibold ${credit ? 'text-emerald-600' : 'text-rose-600'}`}>
              {credit ? '+' : '−'}₹{t.amount}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
