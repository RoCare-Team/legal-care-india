import { redirect } from 'next/navigation';
import { createMetadata } from '@/lib/metadata';
import { Container } from '@/components/ui';
import { getSessionUserId } from '@/lib/auth';
import ReviewResult from '@/components/documentReview/ReviewResult';

export const metadata = createMetadata({
  title: 'Your Document Review',
  description: 'Your document review on Justiceland.',
  path: '/document-review',
  noindex: true,
});

export const dynamic = 'force-dynamic';

export default async function DocumentReviewResultPage({ params }) {
  const { id } = await params;
  const userId = await getSessionUserId();
  if (!userId) redirect(`/user/login?next=${encodeURIComponent(`/document-review/${id}`)}`);

  return (
    <section className="bg-[#F6F8FB] pb-16 pt-8 sm:pt-10">
      <Container className="max-w-3xl">
        <ReviewResult id={id} />
      </Container>
    </section>
  );
}
