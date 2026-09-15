import { NextResponse } from 'next/server';
import { getSessionAdvocateId } from '@/lib/auth';
import { getLawyerPayoutData, requestPayout } from '@/lib/payouts';
import { payoutErrorResponse } from '@/lib/payoutResponses';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard/payouts — the signed-in lawyer's balance, earnings after
 * commission, payout history and bank accounts (last four digits only).
 */
export async function GET() {
  const id = await getSessionAdvocateId();
  if (!id) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  try {
    return NextResponse.json(await getLawyerPayoutData(id), { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return payoutErrorResponse(err, 'payouts GET');
  }
}

/**
 * POST /api/dashboard/payouts  { amount, bankAccountId }
 *
 * Requests a payout. The amount leaves the balance immediately and waits for
 * an admin to transfer it.
 */
export async function POST(request) {
  const id = await getSessionAdvocateId();
  if (!id) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  try {
    const payout = await requestPayout(id, {
      amount: Number(body?.amount),
      bankAccountId: String(body?.bankAccountId || ''),
    });
    return NextResponse.json({ ok: true, payout }, { status: 201 });
  } catch (err) {
    return payoutErrorResponse(err, 'payout request');
  }
}
