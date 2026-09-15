import { NextResponse } from 'next/server';
import { getSessionAdvocateId } from '@/lib/auth';
import { cancelPayout } from '@/lib/payouts';
import { payoutErrorResponse } from '@/lib/payoutResponses';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/dashboard/payouts/<id>  { action: 'cancel' }
 *
 * Withdraws a payout the admin has not processed yet; the amount goes back to
 * the balance.
 */
export async function PATCH(request, { params }) {
  const advocateId = await getSessionAdvocateId();
  if (!advocateId) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const { id } = await params;
  let body = {};
  try {
    body = await request.json();
  } catch {
    /* no body — treated as an unknown action below */
  }
  if (body?.action !== 'cancel') {
    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  }

  try {
    const payout = await cancelPayout(advocateId, id);
    return NextResponse.json({ ok: true, payout });
  } catch (err) {
    return payoutErrorResponse(err, 'payout cancel');
  }
}
