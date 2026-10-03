import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { getRazorpay, toPaise } from '@/lib/razorpay';
import { getPaymentConfig } from '@/lib/paymentSettings';
import { TEST_PAYMENT_RUPEES } from '@/lib/adminTestPayments';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/payments/test — open a ₹1 Razorpay order for the admin.
 *
 * The only way to know the saved keys actually take money is to take some.
 * Client top-ups have a ₹50 floor, so this is the cheap path: the same keys,
 * the same checkout, the same webhook, for one rupee that lands in the ledger
 * marked as a test rather than in anybody's wallet.
 */
export async function POST() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

  const config = await getPaymentConfig();
  if (!config.keyId || !config.keySecret) {
    return NextResponse.json({ error: 'Razorpay keys are not set yet.' }, { status: 503 });
  }

  try {
    const rzp = await getRazorpay();
    const order = await rzp.orders.create({
      amount: toPaise(TEST_PAYMENT_RUPEES),
      currency: 'INR',
      receipt: `t_${Date.now().toString(36)}`,
      // purpose routes the webhook; adminEmail is for the ledger row.
      notes: { purpose: 'admin_test', adminEmail: admin.email },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: config.keyId,
      mode: config.mode,
      prefill: { email: admin.email },
    });
  } catch (err) {
    console.error('admin test payment order failed', err);
    const unauthorised = err?.statusCode === 401;
    return NextResponse.json(
      {
        error: unauthorised
          ? 'Razorpay rejected the saved keys — the key secret is wrong for this key id.'
          : `Razorpay could not open the order${err?.error?.description ? `: ${err.error.description}` : '.'}`,
      },
      { status: 502 }
    );
  }
}
