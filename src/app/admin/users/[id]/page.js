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
import { formatDate } from '@/utils/formatters';

export default async function AdminUserDetailPage({ params }) {
  const { id } = await params;
  const user = await adminGetUserById(id);
  if (!user) notFound();

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
          <InfoRow label="Privacy">{user.anonymous ? 'Anonymous to advocates' : 'Name visible'}</InfoRow>
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
          <WalletList items={user.walletTransactions} />
        </InfoCard>

        <InfoCard title="Consultation history" className="lg:col-span-2">
          <ConsultationList items={user.consultations} perspective="user" empty="This user hasn't booked any consultations." />
        </InfoCard>
      </div>
    </div>
  );
}
