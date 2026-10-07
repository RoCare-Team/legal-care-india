import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { adminCreatePayout } from '@/lib/payouts';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/payouts  { advocateId, amount?, utr? }
 *
 * The admin pays a lawyer from their balance without waiting for a request.
 * `amount` defaults to the whole balance. With a `utr` the payout is recorded
 * as paid straight away; without one it waits under "To pay".
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

  try {
    const payout = await adminCreatePayout(String(body?.advocateId || ''), {
      amount: body?.amount,
      utr: body?.utr,
      adminEmail: admin.email || 'admin',
    });
    return NextResponse.json({ ok: true, payout });
  } catch (err) {
    if (err?.status) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error('admin create payout', err);
    return NextResponse.json({ error: 'Could not create the payout.' }, { status: 500 });
  }
}
