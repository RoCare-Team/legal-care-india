import { redirect } from 'next/navigation';
import {
  Wallet, IndianRupee, Clock, CalendarCheck, MessagesSquare, PhoneCall, Video,
  ArrowDownLeft, ArrowUpRight, Receipt,
} from 'lucide-react';
import EarningsCard from '@/components/dashboard/overview/EarningsCard';
import { getSessionAdvocateId } from '@/lib/auth';
import { getRawAdvocateById } from '@/lib/advocates';
import { getAdvocateConsultations } from '@/lib/consultations';
import { buildOverview, channelTotals, istDateTime } from '@/lib/dashboardOverview';
import Link from 'next/link';
import { advocateRates, formatRate } from '@/constants/callRates';
import { getLawyerPayoutData } from '@/lib/payouts';
import { COMMISSION_LABEL, formatMoney } from '@/constants/payouts';

export const metadata = {
  title: 'Earnings | Lawyer Portal',
  robots: { index: false, follow: false },
};

const money = formatMoney;

const CHANNELS = [
  { key: 'chat', label: 'Chat', icon: MessagesSquare, tone: 'bg-blue-500/10 text-blue-600', bar: 'bg-blue-500' },
  { key: 'audio', label: 'Audio Call', icon: PhoneCall, tone: 'bg-emerald-50 text-emerald-600', bar: 'bg-emerald-500' },
  { key: 'video', label: 'Video Call', icon: Video, tone: 'bg-violet-50 text-violet-600', bar: 'bg-violet-500' },
];

function Tile({ icon: Icon, label, value, sub, tone }) {
  return (
    <div className="rounded-2xl border border-ink/8 bg-surface p-4 shadow-card sm:p-5">
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="mt-3 font-display text-2xl font-semibold text-ink">{value}</p>
      <p className="text-sm text-ink/60">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-ink/45">{sub}</p>}
    </div>
  );
}

/**
 * Earnings — the wallet balance, what it came from (by period and by channel),
 * and every credit and debit on the lawyer's wallet.
 */
export default async function EarningsPage() {
  const id = await getSessionAdvocateId();
  if (!id) redirect('/login');

  // Payout data first: it applies the one-time commission on older balances,
  // so every figure below is already the withdrawable one.
  const payoutData = await getLawyerPayoutData(id);
  const [raw, all] = await Promise.all([getRawAdvocateById(id), getAdvocateConsultations(id)]);
  if (!raw) redirect('/login');

  const consultations = all.filter((c) => !c.hidden);
  const overview = buildOverview(consultations);
  const channels = channelTotals(consultations);
  const rates = advocateRates(raw);

  const { transactions, summary } = payoutData;
  const paid = consultations.filter((c) => c.charged);
  const minutes = paid.reduce((sum, c) => sum + (c.talkedMinutes || 0), 0);
  const channelMax = Math.max(...CHANNELS.map((c) => channels[c.key].earned), 0);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Earnings</h1>
        <p className="mt-1 text-sm text-ink/55">
          Every paid session is split when it ends — JusticeLand keeps {COMMISSION_LABEL}, the rest is yours to withdraw.
        </p>
      </div>

      {/* The balance leads, on navy — it is the number they came for. */}
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary-dark to-secondary p-5 text-white shadow-brand lg:col-span-1">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/20 text-accent">
            <Wallet className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-3 font-display text-3xl font-semibold">{money(payoutData.balance)}</p>
          <p className="text-sm text-white/70">Withdrawable balance</p>
          <Link
            href="/dashboard/payouts"
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-primary-dark hover:brightness-105"
          >
            Withdraw &amp; payouts →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-span-3 lg:grid-cols-3">
          <Tile
            icon={IndianRupee}
            label="Your earnings (all time)"
            value={money(summary.earning)}
            sub={`Clients paid ${money(summary.gross)} · ${COMMISSION_LABEL} commission −${money(summary.commission)}`}
            tone="bg-emerald-50 text-emerald-600"
          />
          <Tile
            icon={CalendarCheck}
            label="Last 30 days"
            value={money(overview.periods.month.earned)}
            sub={`${overview.periods.month.sessions} paid sessions`}
            tone="bg-accent/15 text-amber-700"
          />
          <Tile icon={Clock} label="Minutes billed" value={minutes} sub={`${paid.length} paid sessions`} tone="bg-primary/10 text-primary" />
        </div>
      </div>

      <div className="grid gap-5 sm:gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="min-w-0 space-y-5 sm:space-y-6">
          <EarningsCard
            periods={overview.periods}
            week={overview.week}
            walletBalance={payoutData.balance}
            showLink={false}
          />

          <section className="rounded-2xl border border-ink/8 bg-surface p-5 shadow-card sm:p-6">
            <h2 className="font-display text-lg font-semibold text-ink">By channel</h2>
            <ul className="mt-4 space-y-4">
              {CHANNELS.map(({ key, label, icon: Icon, tone, bar }) => {
                const row = channels[key];
                const pct = channelMax ? Math.round((row.earned / channelMax) * 100) : 0;
                return (
                  <li key={key}>
                    <div className="flex items-center gap-3">
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${tone}`}>
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-sm font-semibold text-ink">{label}</p>
                          <p className="text-sm font-semibold text-ink">{money(row.earned)}</p>
                        </div>
                        <p className="text-xs text-ink/50">
                          {row.sessions} {row.sessions === 1 ? 'session' : 'sessions'} · {row.minutes} min ·{' '}
                          {formatRate(rates[key]) || 'not offered'}
                        </p>
                      </div>
                    </div>
                    <div className="ml-12 mt-2 h-1.5 overflow-hidden rounded-full bg-ink/[0.06]">
                      <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <section className="min-w-0 rounded-2xl border border-ink/8 bg-surface shadow-card">
          <div className="flex items-center justify-between gap-3 border-b border-ink/8 px-5 py-4 sm:px-6">
            <h2 className="flex items-center gap-2.5 font-display text-lg font-semibold text-ink">
              <Receipt className="h-5 w-5 text-primary" aria-hidden="true" />
              Transactions
            </h2>
            <span className="text-xs text-ink/45">{transactions.length} total</span>
          </div>

          {transactions.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-ink/50">
              No transactions yet. Your first paid consultation will show up here.
            </p>
          ) : (
            <ul className="divide-y divide-ink/8">
              {transactions.map((t) => {
                const credit = t.type !== 'debit';
                return (
                  <li key={t.id} className="flex items-center gap-3.5 px-5 py-3.5 sm:px-6">
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                        credit ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                      }`}
                    >
                      {credit ? (
                        <ArrowDownLeft className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {t.note || (credit ? 'Consultation earning' : 'Debit')}
                      </p>
                      <p className="text-xs text-ink/45">
                        {t.createdAt ? istDateTime(t.createdAt) : '—'}
                        {t.kind === 'earning' && t.gross > 0 && (
                          <> · Client paid {money(t.gross)} − {COMMISSION_LABEL} commission {money(t.commission)}</>
                        )}
                      </p>
                    </div>
                    <span className={`shrink-0 text-sm font-semibold ${credit ? 'text-emerald-600' : 'text-red-600'}`}>
                      {credit ? '+' : '−'}
                      {money(t.amount)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
