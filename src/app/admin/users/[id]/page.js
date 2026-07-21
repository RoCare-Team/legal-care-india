import { notFound } from 'next/navigation';
import { Mail, Phone, MapPin, Wallet, EyeOff } from 'lucide-react';
import { adminGetUserById } from '@/lib/admin';
import { AdminAvatar } from '@/components/admin/DataTable';
import {
  DetailBack,
  InfoCard,
  InfoRow,
  StatTile,
  ConsultationList,
  WalletList,
} from '@/components/admin/DetailKit';
import Pagination from '@/components/admin/Pagination';
import { formatDate } from '@/utils/formatters';

// The wallet card sits beside contact details, so it shows fewer rows than the
// full-width consultation history.
const WALLET_PER_PAGE = 4;
const HISTORY_PER_PAGE = 8;

/** Clamp a `?x=` value to a real page number. */
function pageFrom(value, totalPages) {
  const n = Number.parseInt(value, 10);
  return Math.min(Math.max(Number.isNaN(n) ? 1 : n, 1), totalPages);
}

export default async function AdminUserDetailPage({ params, searchParams }) {
  const { id } = await params;
  const user = await adminGetUserById(id);
  if (!user) notFound();

  // The two lists paginate on their own query keys — `?w=` for the wallet and
  // `?c=` for consultations — so paging one never resets the other.
  const sp = (await searchParams) || {};
  const ledger = user.walletTransactions;
  const history = user.consultations;

  const walletPages = Math.max(1, Math.ceil(ledger.length / WALLET_PER_PAGE));
  const walletPage = pageFrom(sp.w, walletPages);
  const walletRows = ledger.slice((walletPage - 1) * WALLET_PER_PAGE, walletPage * WALLET_PER_PAGE);

  const historyPages = Math.max(1, Math.ceil(history.length / HISTORY_PER_PAGE));
  const historyPage = pageFrom(sp.c, historyPages);
  const historyRows = history.slice((historyPage - 1) * HISTORY_PER_PAGE, historyPage * HISTORY_PER_PAGE);

  const basePath = `/admin/users/${user.id}`;

  return (
    <div className="mx-auto max-w-5xl">
      <DetailBack href="/admin/users" label="Back to users" />

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-ink/8 bg-surface p-5 shadow-card">
        <AdminAvatar name={user.name} tone="bg-blue-500/10 text-blue-600" />
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-semibold text-ink">{user.name}</h2>
          <p className="text-sm text-ink/50">Client · joined {formatDate(user.createdAt)}</p>
        </div>
        {user.anonymous && (
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-ink/8 px-3 py-1.5 text-xs font-semibold text-ink/60">
            <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
            Anonymous mode
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Wallet balance" value={`₹${user.walletBalance.toLocaleString('en-IN')}`} tone="text-emerald-600" />
        <StatTile label="Consultations" value={user.stats.total} />
        <StatTile label="Connected" value={user.stats.connected} />
        <StatTile label="Total spent" value={`₹${user.stats.spent.toLocaleString('en-IN')}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <InfoCard title="Contact details">
          <InfoRow label="Email">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-ink/35" aria-hidden="true" />
              {user.email}
            </span>
          </InfoRow>
          <InfoRow label="Phone">
            {user.phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-ink/35" aria-hidden="true" />
                {user.phone}
              </span>
            )}
          </InfoRow>
          <InfoRow label="City">
            {user.city && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-ink/35" aria-hidden="true" />
                {user.city}
              </span>
            )}
          </InfoRow>
          <InfoRow label="Privacy">{user.anonymous ? 'Anonymous to lawyers' : 'Name visible'}</InfoRow>
        </InfoCard>

        <InfoCard
          title="Wallet ledger"
          action={
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
              ₹{user.walletBalance.toLocaleString('en-IN')}
            </span>
          }
        >
          <div className="max-h-[26rem] overflow-y-auto pr-1">
            <WalletList items={walletRows} />
          </div>
          <Pagination
            page={walletPage}
            totalPages={walletPages}
            basePath={basePath}
            total={ledger.length}
            perPage={WALLET_PER_PAGE}
            param="w"
            extra={historyPage > 1 ? { c: String(historyPage) } : undefined}
            label="Wallet ledger pagination"
            compact
          />
        </InfoCard>

        <InfoCard title="Consultation history" className="lg:col-span-2">
          <div className="max-h-[26rem] overflow-y-auto pr-1">
            <ConsultationList items={historyRows} perspective="user" empty="This user hasn't booked any consultations." />
          </div>
          <Pagination
            page={historyPage}
            totalPages={historyPages}
            basePath={basePath}
            total={history.length}
            perPage={HISTORY_PER_PAGE}
            param="c"
            extra={walletPage > 1 ? { w: String(walletPage) } : undefined}
            label="Consultation history pagination"
            compact
          />
        </InfoCard>
      </div>
    </div>
  );
}
