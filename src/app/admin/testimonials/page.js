import { Star } from 'lucide-react';
import { adminGetTestimonials } from '@/lib/admin';
import DataTable, { AdminPageHeader, AdminAvatar } from '@/components/admin/DataTable';
import { formatDate } from '@/utils/formatters';

function Stars({ rating }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-3.5 w-3.5 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-ink/15'}`}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

export default async function AdminTestimonialsPage() {
  const testimonials = await adminGetTestimonials();

  const columns = [
    {
      key: 'name',
      label: 'Author',
      render: (t) => (
        <div className="flex items-center gap-3">
          <AdminAvatar name={t.name} tone="bg-amber-500/10 text-amber-600" />
          <div className="min-w-0">
            <p className="font-semibold text-ink">{t.name}</p>
            <p className="text-xs text-ink/50">{[t.role, t.city].filter(Boolean).join(' · ') || '—'}</p>
          </div>
        </div>
      ),
    },
    { key: 'rating', label: 'Rating', render: (t) => <Stars rating={t.rating} /> },
    {
      key: 'text',
      label: 'Review',
      className: 'max-w-md',
      render: (t) => <p className="line-clamp-3 text-ink/65">{t.text}</p>,
    },
    { key: 'createdAt', label: 'Date', render: (t) => <span className="whitespace-nowrap text-ink/60">{formatDate(t.createdAt)}</span> },
  ];

  return (
    <div>
      <AdminPageHeader title="Testimonials" subtitle="All platform reviews submitted by clients." count={testimonials.length} />
      <DataTable columns={columns} rows={testimonials} empty="No testimonials yet." />
    </div>
  );
}
