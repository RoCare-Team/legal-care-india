import { Sparkles, Hourglass, Scale, CircleCheck, IndianRupee } from 'lucide-react';
import { adminListReviews } from '@/lib/documentReviews';
import { AdminPageHeader } from '@/components/admin/DataTable';
import DocumentReviewsTable from '@/components/admin/DocumentReviewsTable';

/** /admin/document-reviews — AI and lawyer document reviews, and the lawyer queue. */
export const dynamic = 'force-dynamic';

const PER_PAGE = 25;

function Stat({ icon: Icon, label, value, tone }) {
  return (
    <div className="rounded-2xl border border-ink/8 bg-surface p-4 shadow-card">
      <div className="flex items-center gap-2">
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${tone}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink/45">{label}</span>
      </div>
      <p className="mt-2 font-display text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}

export default async function AdminDocumentReviewsPage({ searchParams }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params?.page) || 1);
  const search = String(params?.q || '');
  const kind = ['ai', 'expert'].includes(params?.kind) ? params.kind : '';
  const status = ['paid', 'assigned', 'delivered', 'cancelled', 'done'].includes(params?.status) ? params.status : '';

  const data = await adminListReviews({ kind, status, search, page, perPage: PER_PAGE });

  return (
    <div>
      <AdminPageHeader
        title="Document Reviews"
        subtitle="AI reviews, and lawyer reviews waiting to be assigned, written and sent."
        count={data.total}
      />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat icon={Hourglass} label="Needs a lawyer" value={data.stats.waiting} tone="bg-amber-500/10 text-amber-600" />
        <Stat icon={Scale} label="In review" value={data.stats.inReview} tone="bg-sky-500/10 text-sky-600" />
        <Stat icon={CircleCheck} label="Delivered" value={data.stats.delivered} tone="bg-emerald-500/10 text-emerald-600" />
        <Stat icon={Sparkles} label="AI reviews" value={data.stats.ai} tone="bg-primary/10 text-primary" />
        <Stat
          icon={IndianRupee}
          label="Collected"
          value={`₹${data.stats.collected.toLocaleString('en-IN')}`}
          tone="bg-emerald-500/10 text-emerald-600"
        />
      </div>
      <DocumentReviewsTable
        reviews={data.rows}
        meta={{ page: data.page, totalPages: data.totalPages, total: data.total, perPage: data.perPage, search, kind, status }}
      />
    </div>
  );
}
