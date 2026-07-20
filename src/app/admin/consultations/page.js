import Link from 'next/link';
import { Scale, MessageSquare, IndianRupee } from 'lucide-react';
import { adminGetConsultations } from '@/lib/admin';
import DataTable, { AdminPageHeader, AdminAvatar } from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';
import { formatDate } from '@/utils/formatters';

const PER_PAGE = 20;

/** Colour + label for each consultation status. */
const STATUS_META = {
  pending: { label: 'Pending', tone: 'bg-amber-500/10 text-amber-600' },
  active: { label: 'Active', tone: 'bg-emerald-500/10 text-emerald-600' },
  ended: { label: 'Ended', tone: 'bg-slate-500/10 text-slate-600' },
  rejected: { label: 'Rejected', tone: 'bg-rose-500/10 text-rose-600' },
  cancelled: { label: 'Cancelled', tone: 'bg-ink/10 text-ink/50' },
};

export default async function AdminConsultationsPage({ searchParams }) {
  const consultations = await adminGetConsultations();

  // Total earned across every connected (charged) session — always the full set,
  // never just the visible page.
  const revenue = consultations
    .filter((c) => c.charged)
    .reduce((sum, c) => sum + c.price, 0);

  const totalPages = Math.max(1, Math.ceil(consultations.length / PER_PAGE));
  const requested = Number.parseInt((await searchParams)?.page, 10);
  const page = Math.min(Math.max(Number.isNaN(requested) ? 1 : requested, 1), totalPages);
  const rows = consultations.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const columns = [
    {
      key: 'userName',
      label: 'Client',
      render: (c) => (
        <div className="flex items-center gap-3">
          <AdminAvatar name={c.userName} tone="bg-blue-500/10 text-blue-600" />
          <p className="font-semibold text-ink">{c.userName}</p>
        </div>
      ),
    },
    {
      key: 'advocateName',
      label: 'Advocate',
      render: (c) => (
        <span className="flex items-center gap-1.5 font-medium text-ink/80">
          <Scale className="h-3.5 w-3.5 text-ink/35" aria-hidden="true" />
          {c.advocateName}
        </span>
      ),
    },
    {
      key: 'minutes',
      label: 'Plan',
      render: (c) => <span className="whitespace-nowrap text-ink/70">{c.minutes} min</span>,
    },
    {
      key: 'price',
      label: 'Amount',
      render: (c) => (
        <span className="inline-flex items-center font-semibold text-ink">
          <IndianRupee className="h-3.5 w-3.5" aria-hidden="true" />
          {c.price}
          {!c.charged && <span className="ml-1 text-[11px] font-normal text-ink/40">(not charged)</span>}
        </span>
      ),
    },
    {
      key: 'messagesCount',
      label: 'Chat',
      render: (c) => (
        <Link
          href={`/admin/consultations/${c.id}`}
          aria-label={`Open chat between ${c.userName} and ${c.advocateName}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 px-2.5 py-1 font-semibold text-ink/60 transition-colors hover:border-primary/30 hover:bg-primary/[0.06] hover:text-primary"
        >
          <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
          {c.messagesCount}
        </Link>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (c) => {
        const meta = STATUS_META[c.status] || STATUS_META.pending;
        return (
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.tone}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
            {meta.label}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      label: 'Booked',
      render: (c) => <span className="whitespace-nowrap text-ink/60">{formatDate(c.createdAt)}</span>,
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Consultations"
        subtitle="Every paid live-chat session booked on the platform."
        count={consultations.length}
      />

      {/* Revenue strip — total collected from connected sessions. */}
      <div className="mb-6 inline-flex items-center gap-3 rounded-2xl border border-ink/8 bg-surface px-5 py-3.5 shadow-card">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
          <IndianRupee className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="font-display text-2xl font-bold leading-tight text-ink">₹{revenue.toLocaleString('en-IN')}</p>
          <p className="text-xs text-ink/50">Total collected from connected sessions</p>
        </div>
      </div>

      <DataTable columns={columns} rows={rows} empty="No consultations yet." maxHeight="34rem" />

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/admin/consultations"
        total={consultations.length}
        perPage={PER_PAGE}
      />
    </div>
  );
}
