import { NextResponse } from 'next/server';
import { getSessionAdvocateId } from '@/lib/auth';
import { deliverReview, getReviewsForAdvocate } from '@/lib/documentReviews';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard/document-reviews → { reviews }
 * The Advocate Document Opinion requests an admin has assigned to this
 * lawyer, newest first: 'assigned' ones are waiting for their report,
 * 'delivered' ones are done. The file itself is at
 * /api/document-review/<id>/file.
 */
export async function GET() {
  const advocateId = await getSessionAdvocateId();
  if (!advocateId) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  const reviews = await getReviewsForAdvocate(advocateId);
  return NextResponse.json({ reviews }, { headers: { 'Cache-Control': 'no-store' } });
}

/**
 * POST /api/dashboard/document-reviews  { id, report }
 * The assigned lawyer sends their written report to the client. Their share
 * of the fee is credited to their earnings wallet when it is sent.
 */
export async function POST(request) {
  const advocateId = await getSessionAdvocateId();
  if (!advocateId) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  try {
    const review = await deliverReview({ id: String(body?.id || ''), report: body?.report, by: 'lawyer', advocateId });
    return NextResponse.json({ ok: true, review });
  } catch (err) {
    if (err?.status) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error('lawyer document review error', err);
    return NextResponse.json({ error: 'Could not send the report.' }, { status: 500 });
  }
}
