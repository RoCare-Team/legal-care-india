import { NextResponse } from 'next/server';
import { getSessionAdvocateId } from '@/lib/auth';
import { deliverReview } from '@/lib/documentReviews';

export const dynamic = 'force-dynamic';

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
