import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { getRazorpay, verifyPaymentSignature, toRupees } from '@/lib/razorpay';
import { getPaymentConfig } from '@/lib/paymentSettings';
import { recordTestPayment } from '@/lib/adminTestPayments';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/payments/test/verify
 *   { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 *
 * Second half of the ₹1 test. Runs the same three checks a client top-up gets
 * — signature, captured status, order match — so a pass here means a real
 * client payment would pass too.
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

  const orderId = String(body?.razorpay_order_id || '');
  const paymentId = String(body?.razorpay_payment_id || '');
  const signature = String(body?.razorpay_signature || '');
  if (!orderId || !paymentId || !signature) {
    return NextResponse.json({ error: 'Incomplete payment details.' }, { status: 400 });
  }

  if (!(await verifyPaymentSignature({ orderId, paymentId, signature }))) {
    return NextResponse.json(
      { error: 'Signature check failed — the saved key secret does not match this key id.' },
      { status: 400 }
    );
  }

  try {
    const rzp = await getRazorpay();
    const payment = await rzp.payments.fetch(paymentId);

    if (payment?.order_id !== orderId || payment?.notes?.purpose !== 'admin_test') {
      return NextResponse.json({ error: 'That payment is not a test payment.' }, { status: 400 });
    }

    // Auto-capture off in the Razorpay dashboard leaves payments 'authorized'
    // — the money is held, never collected, and refunded after a few days.
    // Every client payment on the site would hit the same wall, so say so.
    if (payment.status !== 'captured') {
      return NextResponse.json(
        {
          error: `Payment is "${payment.status}", not captured. Turn on automatic capture in Razorpay Dashboard → Account & Settings → Payment capture, or every payment on the site will stall the same way.`,
          status: payment.status,
        },
        { status: 409 }
      );
    }

    const { mode } = await getPaymentConfig();
    const doc = await recordTestPayment({
      paymentId,
      orderId,
      amount: toRupees(payment.amount),
      mode,
      adminEmail: admin.email,
      via: 'verify',
    });

    return NextResponse.json({
      ok: true,
      paymentId,
      amount: toRupees(payment.amount),
      method: payment.method || '',
      webhookSeen: Boolean(doc?.webhookSeenAt),
    });
  } catch (err) {
    console.error('admin test payment verify failed', err);
    return NextResponse.json(
      { error: 'Paid, but the server could not confirm it with Razorpay. Check "Live from Razorpay" below.' },
      { status: 502 }
    );
  }
}
