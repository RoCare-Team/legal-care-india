import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { cancelServiceOrder } from '@/lib/legalServices';

export const dynamic = 'force-dynamic';

/**
 * POST /api/marketplace/orders/[id]/cancel
 *
 * Called when a client dismisses the Razorpay sheet without paying. An
 * abandoned order holds whatever wallet share it was going to spend, and this
 * is what gives it straight back rather than making them wait out the
 * half-hour sweep for money they can see is missing.
 *
 * Only a pending order can be cancelled, and only by its owner. A paid order
 * is refunded, which is a different thing and not something a client does to
 * themselves.
 */
export async function POST(request, { params }) {
  const session = await getSession();
  if (!session || session.role !== 'user') {
    return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await cancelServiceOrder({ orderId: id, userId: session.id });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status || 404 });
    }
    return NextResponse.json({ ok: true, refunded: result.refunded });
  } catch (err) {
    console.error('service order cancel error', err);
    return NextResponse.json({ error: 'Could not cancel that order.' }, { status: 500 });
  }
}
