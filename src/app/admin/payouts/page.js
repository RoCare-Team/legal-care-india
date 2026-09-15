import Link from 'next/link';
import { Clock, CheckCircle2, XCircle, Percent } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/DataTable';
import PayoutRequests from '@/components/admin/PayoutRequests';
import { adminListPayouts } from '@/lib/payouts';
import { COMMISSION_LABEL, formatMoney } from '@/constants/payouts';

/**
 * /admin/payouts — lawyers' withdrawal requests.
 *
 * Payouts are transferred by hand: the account details are shown in full here
 * to copy into the bank's transfer screen, and the request is then marked paid
 * with the bank's reference. Rejecting one returns the amount to the lawyer.
 */
export const dynamic = 'force-dynamic';

const TABS = [
  { key: 'requested', label: 'To pay' },
  { key: 'paid', label: 'Paid' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'all', label: 'All' },
];

export default async function AdminPayoutsPage({ searchParams }) {
  const params = await searchParams;
  const tab = TABS.find((t) => t.key === params?.status) || TABS[0];
  const { payouts, stats } = await adminListPayouts({ status: tab.key });

  const stat = (key) => stats[key] || { count: 0, amount: 0 };

  return (
    <div>
      <AdminPageHeader
        title="Payouts"
        subtitle={`Lawyer withdrawals. JusticeLand keeps ${COMMISSION_LABEL} of every paid consultation; lawyers withdraw the rest.`}
        count={payouts.length}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Clock, label: 'Waiting to be paid', s: stat('requested'), tone: 'bg-amber-500/10 text-amber-700' },
          { icon: CheckCircle2, label: 'Paid out', s: stat('paid'), tone: 'bg-emerald-500/10 text-emerald-600' },
          { icon: XCircle, label: 'Rejected', s: stat('rejected'), tone: 'bg-rose-500/10 text-rose-600' },
        ].map(({ icon: Icon, label, s, tone }) => (
          <div key={label} className="rounded-2xl border border-ink/8 bg-surface p-5 shadow-card">
            <div className="flex items-center gap-2.5">
              <span className={`grid h-9 w-9 place-items-center rounded-xl ${tone}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-ink/45">{label}</span>
            </div>
            <p className="mt-3 font-display text-2xl font-bold text-ink">{formatMoney(s.amount)}</p>
            <p className="mt-0.5 text-xs text-ink/45">{s.count} {s.count === 1 ? 'payout' : 'payouts'}</p>
          </div>
        ))}
      </div>

      <nav className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === 'requested' ? '/admin/payouts' : `/admin/payouts?status=${t.key}`}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${
              t.key === tab.key ? 'border-primary bg-primary text-white' : 'border-ink/10 bg-surface text-ink/65 hover:border-primary/40'
            }`}
          >
            {t.label}
            {t.key !== 'all' && <span className="ml-1.5 text-xs opacity-70">{stat(t.key).count}</span>}
          </Link>
        ))}
      </nav>

      <p className="mb-4 flex items-center gap-2 text-xs text-ink/50">
        <Percent className="h-3.5 w-3.5" aria-hidden="true" />
        Amounts are already after commission — transfer exactly what is shown.
      </p>

      <PayoutRequests payouts={payouts} />
    </div>
  );
}
