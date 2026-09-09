import { NextResponse } from 'next/server';
import { getSessionAdvocateId } from '@/lib/auth';
import { grantMembership } from '@/lib/membership';
import {
  getRazorpay,
  isRazorpayConfigured,
  verifyPaymentSignature,
} from '@/lib/razorpay';

export const dynamic = 'force-dynamic';

/**
 * POST /api/membership/verify
 *   { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 *
 * Step 2. Everything in the body came from a browser, so nothing is granted
 * until four things hold:
 *
 *   1. the signature really was produced with our key secret;
 *   2. Razorpay itself reports the payment captured, for that order;
 *   3. the order is one we opened for THIS lawyer — a valid signature from
 *      somebody else's payment must not upgrade the caller;
 *   4. the amount Razorpay says was paid is the amount that plan costs.
 *
 * Which plan is granted comes off the order's notes, never off the request.
 */
export async function POST(request) {
  const advocateId = await getSessionAdvocateId();
  if (!advocateId) {
    return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  }

  if (!(await isRazorpayConfigured())) {
    return NextResponse.json({ error: 'Payments are not configured.' }, { status: 503 });
  }

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
    console.warn('membership verify: bad signature', { orderId, paymentId, advocateId });
    return NextResponse.json({ error: 'Payment could not be verified.' }, { status: 400 });
  }

  try {
    const rzp = await getRazorpay();
    const [payment, order] = await Promise.all([
      rzp.payments.fetch(paymentId),
      rzp.orders.fetch(orderId),
    ]);

    if (String(order?.notes?.advocateId || '') !== String(advocateId)) {
      console.warn('membership verify: order/advocate mismatch', { orderId, advocateId });
      return NextResponse.json({ error: 'Payment could not be verified.' }, { status: 400 });
    }
    if (payment?.status !== 'captured' || String(payment?.order_id) !== orderId) {
      return NextResponse.json({ error: 'Payment is not complete.' }, { status: 400 });
    }

    // What is granted comes off the order Razorpay holds, never off the
    // request body — the browser has already been shown to be honest about
    // this payment, not about which plan it was for.
    const result = await grantMembership({
      advocateId,
      planId: String(order?.notes?.planId || ''),
      paymentId,
      orderId,
      amountPaise: payment.amount,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status || 400 });
    }

    return NextResponse.json({
      ok: true,
      alreadyApplied: !result.applied,
      planId: result.planId,
      planName: result.planName,
      expiresAt: result.expiresAt,
      price: result.price,
    });
  } catch (err) {
    console.error('membership verify error', err);
    return NextResponse.json(
      { error: 'Could not confirm the payment. If money was deducted, contact support.' },
      { status: 502 }
    );
  }
}
