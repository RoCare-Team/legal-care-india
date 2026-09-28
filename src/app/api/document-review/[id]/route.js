import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getReviewFor, runAiReview, serializeReview } from '@/lib/documentReviews';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * GET /api/document-review/<id> — a client's own review. A paid AI review
 * whose read never ran (the payment came in by webhook, or the first attempt
 * failed) is run here, so opening the review is always enough to finish it.
 */
export async function GET(_request, { params }) {
  const session = await getSession();
  if (!session || session.role !== 'user') return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  const { id } = await params;
  let review = await getReviewFor(id, { userId: session.id });
  if (!review) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  if (review.kind === 'ai' && review.status === 'paid') review = await runAiReview(review._id);
  return NextResponse.json({ review: serializeReview(review) });
}
