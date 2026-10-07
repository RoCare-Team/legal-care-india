import Link from 'next/link';
import {
  IndianRupee, Percent, Scale, CheckCircle2, Clock, Wallet, ArrowRight, Landmark, ReceiptText, Users,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/DataTable';
import PayoutRequests from '@/components/admin/PayoutRequests';
import LawyerEarnings from '@/components/admin/LawyerEarnings';
import { adminListPayouts, adminLawyerEarnings } from '@/lib/payouts';
import { COMMISSION_LABEL, formatMoney } from '@/constants/payouts';

/**
 * /admin/payouts — what lawyers have earned, what is owed to them, and paying it.
 *
 * Opens on the money itself: what clients paid for consultations and reviews,
 * JusticeLand's commission, the lawyers' share, what has gone out and what is
 * still owed. "Lawyer earnings" lists everyone who is owed, with a Pay button;
 * the other tabs are the payouts themselves — requested by a lawyer from their
 * Earnings page or started here — transferred by hand and closed with the
 * bank's reference (UTR).
 */
export const dynamic = 'force-dynamic';

const TABS = [
  { key: 'earnings', label: 'Lawyer earnings' },
  { key: 'requested', label: 'To pay' },
  { key: 'paid', label: 'Paid' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'all', label: 'All payouts' },
];

function Stat({ icon: Icon, label, value, hint, tone }) {
  return (
    <div className="rounded-2xl border border-ink/8 bg-surface p-4 shadow-card sm:p-5">
      <div className="flex items-center gap-2.5">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tone}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink/45">{label}</span>
      </div>
      <p className="mt-3 font-display text-2xl font-bold tabular-nums text-ink">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-ink/45">{hint}</p>}
    </div>
  );
}

const STEPS = [
  { icon: ReceiptText, title: 'Client pays', text: 'A consultation ends or a document review is delivered — the client’s wallet is charged.' },
  { icon: Percent, title: `JusticeLand keeps ${COMMISSION_LABEL}`, text: 'The rest is credited to the lawyer’s balance at once, line by line in their Earnings ledger.' },
  { icon: Landmark, title: 'Transfer from the bank', text: 'Lawyer requests a payout, or you press Pay below. Send NEFT/IMPS to the account shown.' },
  { icon: CheckCircle2, title: 'Enter the UTR', text: 'Paste the bank’s reference and mark it paid. The lawyer sees it with the UTR.' },
];

export default async function AdminPayoutsPage({ searchParams }) {
  const params = await searchParams;
  const [earnings, requestedList] = await Promise.all([
    adminLawyerEarnings(),
    adminListPayouts({ status: 'requested' }),
  ]);

  // With requests waiting, they come first; otherwise the earnings list.
  const stats = requestedList.stats;
  const stat = (key) => stats[key] || { count: 0, amount: 0 };
  const defaultTab = stat('requested').count > 0 ? 'requested' : 'earnings';
  const tab = TABS.find((t) => t.key === params?.status) || TABS.find((t) => t.key === defaultTab);

  const list = tab.key === 'earnings'
    ? null
    : tab.key === 'requested'
      ? requestedList
      : await adminListPayouts({ status: tab.key });

  const t = earnings.totals;

  return (
    <div>
      <AdminPageHeader
        title="Payouts"
        subtitle={`What lawyers have earned and what is owed to them. JusticeLand keeps ${COMMISSION_LABEL} of every paid consultation and review; lawyers are paid the rest.`}
        count={t.lawyers}
      />

      {/* The money, in the order it flows. */}
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Stat icon={IndianRupee} label="Clients paid" value={formatMoney(t.gross)} hint="Consultations & reviews, all time" tone="bg-primary/10 text-primary" />
        <Stat icon={Percent} label={`Commission ${COMMISSION_LABEL}`} value={formatMoney(t.commission)} hint="JusticeLand’s share" tone="bg-violet-500/10 text-violet-600" />
        <Stat icon={Scale} label="Lawyers’ share" value={formatMoney(t.earned)} hint={`${t.lawyers} ${t.lawyers === 1 ? 'lawyer' : 'lawyers'} earned`} tone="bg-sky-500/10 text-sky-600" />
        <Stat icon={CheckCircle2} label="Paid out" value={formatMoney(t.paidOut)} hint={`${stat('paid').count} transfers`} tone="bg-emerald-500/10 text-emerald-600" />
        <Stat icon={Clock} label="Waiting to pay" value={formatMoney(t.processing)} hint={`${stat('requested').count} in To pay`} tone="bg-amber-500/10 text-amber-700" />
        <Stat
          icon={Wallet}
          label="Still owed"
          value={formatMoney(t.owed)}
          hint={`${t.readyToPay} ready to pay${t.noBank ? ` · ${t.noBank} without a bank account` : ''}`}
          tone="bg-rose-500/10 text-rose-600"
        />
      </div>

      {/* How a payout is made — the whole procedure on one line. */}
      <div className="mb-6 rounded-2xl border border-ink/8 bg-surface p-4 shadow-card sm:p-5">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
          <Users className="h-4 w-4 text-primary" aria-hidden="true" />
          How payouts work
        </p>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative flex gap-3 rounded-xl bg-muted/60 p-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <s.icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">
                  {i + 1}. {s.title}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink/55">{s.text}</p>
              </div>
              {i < STEPS.length - 1 && (
                <ArrowRight className="absolute -right-2.5 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-ink/25 lg:block" aria-hidden="true" />
              )}
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-ink/45">
          Balance = lawyer’s share − paid out − waiting. Minimum payout {formatMoney(earnings.minPayout)}. One open payout per lawyer at a time.
        </p>
      </div>

      <nav className="mb-4 flex flex-wrap gap-2">
        {TABS.map((x) => {
          const count = x.key === 'earnings'
            ? t.readyToPay
            : x.key === 'all' ? null : stat(x.key).count;
          return (
            <Link
              key={x.key}
              href={x.key === defaultTab ? '/admin/payouts' : `/admin/payouts?status=${x.key}`}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${
                x.key === tab.key ? 'border-primary bg-primary text-white' : 'border-ink/10 bg-surface text-ink/65 hover:border-primary/40'
              }`}
            >
              {x.label}
              {count !== null && <span className="ml-1.5 text-xs opacity-70">{count}</span>}
            </Link>
          );
        })}
      </nav>

      {tab.key === 'earnings' ? (
        <LawyerEarnings lawyers={earnings.lawyers} minPayout={earnings.minPayout} />
      ) : (
        <>
          <p className="mb-4 flex items-center gap-2 text-xs text-ink/50">
            <Percent className="h-3.5 w-3.5" aria-hidden="true" />
            Amounts are already after commission — transfer exactly what is shown.
          </p>
          <PayoutRequests payouts={list.payouts} />
        </>
      )}
    </div>
  );
}
