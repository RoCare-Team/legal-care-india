import Link from 'next/link';
import { Scale, Phone, PhoneCall } from 'lucide-react';
import { adminGetPhoneCalls } from '@/lib/admin';
import DataTable, { AdminPageHeader, AdminAvatar } from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';
import { formatDate } from '@/utils/formatters';

const PER_PAGE = 20;

/**
 * Clock time to sit under the date. A call log is read to answer "when did this
 * happen", and two calls on the same day are otherwise indistinguishable.
 * Formatted by hand rather than via `toLocaleTimeString` so the output does not
 * depend on the server's locale.
 */
function formatTime(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const hours = d.getHours();
  const h12 = hours % 12 || 12;
  return `${h12}:${String(d.getMinutes()).padStart(2, '0')} ${hours < 12 ? 'am' : 'pm'}`;
}

/**
 * Admin → Phone calls. Who rang which lawyer through the dialler, and when.
 *
 * Read-only, like the rest of the panel. Duration and whether the lawyer
 * actually answered are not here: Smartflo only reports those to a webhook,
 * which is not wired up.
 */
export default async function AdminCallsPage({ searchParams }) {
  const calls = await adminGetPhoneCalls();

  // Distinct callers across the whole set, not just the visible page.
  const callers = new Set(calls.map((c) => c.userId)).size;

  const totalPages = Math.max(1, Math.ceil(calls.length / PER_PAGE));
  const requested = Number.parseInt((await searchParams)?.page, 10);
  const page = Math.min(Math.max(Number.isNaN(requested) ? 1 : requested, 1), totalPages);
  const rows = calls.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const columns = [
    {
      key: 'userName',
      label: 'Client',
      render: (c) => (
        <div className="flex items-center gap-3">
          <AdminAvatar name={c.userName} tone="bg-blue-500/10 text-blue-600" />
          <div>
            <p className="font-semibold text-ink">{c.userName}</p>
            {c.userPhone && <p className="text-xs text-ink/45">{c.userPhone}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'advocateName',
      label: 'Lawyer',
      render: (c) => (
        <div>
          <span className="flex items-center gap-1.5 font-medium text-ink/80">
            <Scale className="h-3.5 w-3.5 text-ink/35" aria-hidden="true" />
            {c.advocateProfilePath ? (
              <Link href={`/lawyers/${c.advocateProfilePath}`} className="hover:text-primary hover:underline">
                {c.advocateName}
              </Link>
            ) : (
              c.advocateName
            )}
          </span>
          {c.advocatePhone && <p className="mt-0.5 text-xs text-ink/45">{c.advocatePhone}</p>}
        </div>
      ),
    },
    {
      key: 'advocateCity',
      label: 'City',
      render: (c) => <span className="text-ink/70">{c.advocateCity || <span className="text-ink/30">—</span>}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: () => (
        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
          <Phone className="h-3 w-3" aria-hidden="true" />
          Call placed
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'When',
      render: (c) => (
        <div className="whitespace-nowrap">
          <p className="text-ink/70">{formatDate(c.createdAt)}</p>
          <p className="text-xs text-ink/45">{formatTime(c.createdAt)}</p>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Phone Calls"
        subtitle="Every call a client placed to a lawyer through the dialler."
        count={calls.length}
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <div className="inline-flex items-center gap-3 rounded-2xl border border-ink/8 bg-surface px-5 py-3.5 shadow-card">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
            <PhoneCall className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-display text-2xl font-bold leading-tight text-ink">{calls.length}</p>
            <p className="text-xs text-ink/50">
              Calls placed
              {callers > 0 && <> · by {callers} client{callers > 1 ? 's' : ''}</>}
            </p>
          </div>
        </div>
      </div>

      <DataTable columns={columns} rows={rows} empty="No calls placed yet." maxHeight="34rem" />

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/admin/calls"
        total={calls.length}
        perPage={PER_PAGE}
      />
    </div>
  );
}
