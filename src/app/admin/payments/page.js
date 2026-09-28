import { IndianRupee, TrendingUp, Wallet, Crown } from 'lucide-react';
import { adminGetPayments } from '@/lib/admin';
import { getPaymentConfigForAdmin } from '@/lib/paymentSettings';
import { AdminPageHeader } from '@/components/admin/DataTable';
import PaymentKeysCard from '@/components/admin/PaymentKeysCard';
import PaymentsTable from '@/components/admin/PaymentsTable';

/**
 * /admin/payments — every rupee that came in through Razorpay.
 *
 * Never cached: this is what gets opened when someone says a payment is
 * missing, and a figure five minutes stale is worse than no figure at all.
 */
export const dynamic = 'force-dynamic';

const PER_PAGE = 25;

function money(value = 0) {
  return `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function StatCard({ icon: Icon, label, value, hint, tone }) {
  return (
    <div className="rounded-2xl border border-ink/8 bg-surface p-5 shadow-card">
      <div className="flex items-center gap-2.5">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tone}`}>
          <Icon className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-ink/45">{label}</span>
      </div>
      <p className="mt-3 font-display text-2xl font-bold text-ink">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-ink/45">{hint}</p>}
    </div>
  );
}

export default async function AdminPaymentsPage({ searchParams }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params?.page) || 1);
  const search = String(params?.q || '');
  const kind = String(params?.kind || '');

  const [data, config] = await Promise.all([
    adminGetPayments({ page, perPage: PER_PAGE, search, kind }),
    getPaymentConfigForAdmin(),
  ]);

  return (
    <div>
      <AdminPageHeader
        title="Payments"
        subtitle="Wallet top-ups and lawyer memberships, and the keys the site charges with."
        count={data.total}
      />

      {/* The total first, then where it came from. Splitting it is the point:
          clients topping up and lawyers paying for a plan are two different
          businesses, and one figure for both hides which is growing. */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={IndianRupee}
          label="Collected"
          value={money(data.stats.collected)}
          hint={kind ? 'In this view, all time' : 'Everything, all time'}
          tone="bg-emerald-500/10 text-emerald-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Last 30 days"
          value={money(data.stats.last30Days)}
          hint={`${data.stats.last30Count} ${data.stats.last30Count === 1 ? 'payment' : 'payments'}`}
          tone="bg-primary/10 text-primary"
        />
        <StatCard
          icon={Wallet}
          label="Wallet top-ups"
          value={money(data.stats.wallet)}
          hint={`${data.stats.walletCount} from clients`}
          tone="bg-sky-500/10 text-sky-600"
        />
        <StatCard
          icon={Crown}
          label="Memberships"
          value={money(data.stats.plans)}
          hint={`${data.stats.planCount} from lawyers`}
          tone="bg-amber-500/10 text-amber-600"
        />
      </div>

      <div className="mb-8">
        <PaymentKeysCard config={config} />
      </div>

      <PaymentsTable
        payments={data.rows}
        meta={{
          page: data.page,
          totalPages: data.totalPages,
          total: data.total,
          perPage: data.perPage,
          search,
          kind: data.kind,
        }}
      />
    </div>
  );
}
