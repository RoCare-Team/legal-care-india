import { Phone, Scale } from 'lucide-react';
import { adminGetEnquiries } from '@/lib/admin';
import DataTable, { AdminPageHeader, AdminAvatar } from '@/components/admin/DataTable';
import { formatDate } from '@/utils/formatters';
import { USER_STATUS_META } from '@/constants/enquiryStatus';

export default async function AdminEnquiriesPage() {
  const enquiries = await adminGetEnquiries();

  const columns = [
    {
      key: 'name',
      label: 'From (client)',
      render: (e) => (
        <div className="flex items-center gap-3">
          <AdminAvatar name={e.name} tone="bg-emerald-500/10 text-emerald-600" />
          <div className="min-w-0">
            <p className="font-semibold text-ink">{e.name}</p>
            <p className="flex items-center gap-1 text-xs text-ink/50">
              <Phone className="h-3 w-3" aria-hidden="true" />
              {e.phone}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'advocateName',
      label: 'To (advocate)',
      render: (e) =>
        e.advocateName ? (
          <span className="flex items-center gap-1.5 font-medium text-ink/80">
            <Scale className="h-3.5 w-3.5 text-ink/35" aria-hidden="true" />
            {e.advocateName}
          </span>
        ) : (
          <span className="text-ink/30">—</span>
        ),
    },
    {
      key: 'message',
      label: 'Message',
      className: 'max-w-xs',
      render: (e) => <p className="line-clamp-2 text-ink/65">{e.message}</p>,
    },
    { key: 'preferredDate', label: 'Preferred', render: (e) => e.preferredDate || <span className="text-ink/30">—</span> },
    {
      key: 'status',
      label: 'Status',
      render: (e) => {
        const meta = USER_STATUS_META[e.status] || USER_STATUS_META.new;
        return (
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.tone}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
            {meta.label}
          </span>
        );
      },
    },
    { key: 'createdAt', label: 'Date', render: (e) => <span className="whitespace-nowrap text-ink/60">{formatDate(e.createdAt)}</span> },
  ];

  return (
    <div>
      <AdminPageHeader title="Enquiries" subtitle="All consultation bookings sent to advocates." count={enquiries.length} />
      <DataTable columns={columns} rows={enquiries} empty="No enquiries yet." />
    </div>
  );
}
