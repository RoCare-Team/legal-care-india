import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { assignReview, deliverReview, cancelReview } from '@/lib/documentReviews';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/document-reviews
 *   { id, action: 'assign', advocate }   — advocate: Justiceland ID or _id
 *   { id, action: 'deliver', report }    — admin writes the report themselves
 *   { id, action: 'cancel', note }       — refund is made from Razorpay
 */
export async function POST(request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const id = String(body?.id || '');
  try {
    let review;
    if (body?.action === 'assign') review = await assignReview({ id, advocateRef: body.advocate });
    else if (body?.action === 'deliver') review = await deliverReview({ id, report: body.report, by: admin.email || 'admin' });
    else if (body?.action === 'cancel') review = await cancelReview({ id, note: body.note });
    else return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
    return NextResponse.json({ ok: true, review });
  } catch (err) {
    if (err?.status) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error('admin document review error', err);
    return NextResponse.json({ error: 'Could not update the review.' }, { status: 500 });
  }
}
