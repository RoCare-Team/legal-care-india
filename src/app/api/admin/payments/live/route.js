import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { getRazorpay, toRupees } from '@/lib/razorpay';
import { isRazorpayConfigured } from '@/lib/paymentSettings';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/payments/live — the last 50 payments straight from Razorpay.
 *
 * The local table only knows about money that reached a wallet. This shows the
 * gateway's own view, so failed and pending attempts are visible too — which is
 * what you actually want when a user says "paisa kat gaya par wallet khaali hai".
 *
 * Fetched on demand rather than on page load: it is a network call to Razorpay,
 * and the admin only needs it when something looks wrong.
 */
export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

  if (!(await isRazorpayConfigured())) {
    return NextResponse.json({ error: 'Razorpay keys are not set yet.' }, { status: 503 });
  }

  try {
    const rzp = await getRazorpay();
    const res = await rzp.payments.all({ count: 50 });

    const payments = (res?.items || []).map((p) => ({
      id: p.id,
      orderId: p.order_id || '',
      amount: toRupees(p.amount),
      status: p.status || 'unknown',
      method: p.method || '',
      email: p.email || '',
      contact: p.contact || '',
      description: p.description || '',
      // Whose wallet it was meant for — set when we created the order.
      userId: p.notes?.userId || '',
      errorReason: p.error_description || '',
      createdAt: p.created_at ? new Date(p.created_at * 1000).toISOString() : null,
    }));

    return NextResponse.json({ payments });
  } catch (err) {
    console.error('razorpay live payments failed', err);
    const unauthorised = err?.statusCode === 401;
    return NextResponse.json(
      {
        error: unauthorised
          ? 'Razorpay rejected the saved keys. Update them above.'
          : 'Could not reach Razorpay. Please try again.',
      },
      { status: 502 }
    );
  }
}
