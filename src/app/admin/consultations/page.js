import Link from 'next/link';
import { Scale, MessageSquare, IndianRupee, Video } from 'lucide-react';
import { adminGetConsultations, adminGetLiveConsultations } from '@/lib/admin';
import DataTable, { AdminPageHeader, AdminAvatar } from '@/components/admin/DataTable';
import { CallPill, formatCallDuration } from '@/components/admin/DetailKit';
import Pagination from '@/components/admin/Pagination';
import LiveConsultations from '@/components/admin/LiveConsultations';
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
  const [consultations, live] = await Promise.all([
    adminGetConsultations(),
    adminGetLiveConsultations(),
  ]);
  // The desk runs its own clocks against this, so a panel on a machine whose
  // time is off still shows the bill the client is actually running up.
  const serverNow = Date.now();

  // Total earned across every connected (charged) session — always the full set,
  // never just the visible page.
  const revenue = consultations
    .filter((c) => c.charged)
    .reduce((sum, c) => sum + c.price, 0);

  // Video-call usage across every session — how many actually connected, and
  // how much time was spent on camera in total.
  const callsConnected = consultations.filter((c) => c.call.connected).length;
  const callSeconds = consultations.reduce((sum, c) => sum + c.call.durationSec, 0);

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
      label: 'Lawyer',
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
          {/* A discounted session says so here, so the smaller number is never
              read as a billing bug. */}
          {c.discount && (
            <span className="ml-1.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600">
              {c.discount.label}
            </span>
          )}
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
      key: 'call',
      label: 'Video call',
      render: (c) => <CallPill call={c.call} />,
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

      {/* Everything happening right now, with the controls over it. First on
          the page because it is the only part of this screen anyone can still
          do something about. */}
      <LiveConsultations initial={live} serverNow={serverNow} />

      {/* Summary strip — money collected, and how much of it went on video. */}
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="inline-flex items-center gap-3 rounded-2xl border border-ink/8 bg-surface px-5 py-3.5 shadow-card">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
            <IndianRupee className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-display text-2xl font-bold leading-tight text-ink">₹{revenue.toLocaleString('en-IN')}</p>
            <p className="text-xs text-ink/50">Total collected from connected sessions</p>
          </div>
        </div>

        <div className="inline-flex items-center gap-3 rounded-2xl border border-ink/8 bg-surface px-5 py-3.5 shadow-card">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
            <Video className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-display text-2xl font-bold leading-tight text-ink">{callsConnected}</p>
            <p className="text-xs text-ink/50">
              Video calls connected
              {callSeconds > 0 && <> · {formatCallDuration(callSeconds)} on camera</>}
            </p>
          </div>
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
