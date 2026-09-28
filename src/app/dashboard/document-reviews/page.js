import { redirect } from 'next/navigation';
import { getSessionAdvocateId } from '@/lib/auth';
import { getReviewsForAdvocate } from '@/lib/documentReviews';
import LawyerReviews from '@/components/dashboard/LawyerReviews';

export const metadata = {
  title: 'Document Reviews | Lawyer Portal',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function DashboardDocumentReviewsPage() {
  const id = await getSessionAdvocateId();
  if (!id) redirect('/login');

  const reviews = await getReviewsForAdvocate(id);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Document Reviews</h1>
        <p className="mt-1 text-sm text-ink/55">
          Client documents assigned to you. Read the document, write your opinion, and send it — you are paid when it is sent.
        </p>
      </div>
      <LawyerReviews reviews={reviews} />
    </div>
  );
}
