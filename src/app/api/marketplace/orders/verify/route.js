import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { markServiceOrderPaid, serializeOrder } from '@/lib/legalServices';
import {
  getRazorpay,
  isRazorpayConfigured,
  verifyPaymentSignature,
} from '@/lib/razorpay';

export const dynamic = 'force-dynamic';

/**
 * POST /api/marketplace/orders/verify
 *   { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 *
 * Step 2 of buying a service. Everything in the body came from the browser, so
 * four things are proved before an order is marked paid:
 *
 *   1. the signature was produced with our key secret;
 *   2. Razorpay itself reports the payment as captured, against that order;
 *   3. the order was opened by us, for this service purchase, for this client;
 *   4. the amount captured is the amount the order asked for — checked in
 *      `markServiceOrderPaid`, against the figure we stored, never one sent.
 */
export async function POST(request) {
  const session = await getSession();
  if (!session || session.role !== 'user') {
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
    console.warn('service order verify: bad signature', { orderId, user: session.id });
    return NextResponse.json({ error: 'Payment could not be verified.' }, { status: 400 });
  }

  try {
    const rzp = await getRazorpay();
    const [payment, rzpOrder] = await Promise.all([
      rzp.payments.fetch(paymentId),
      rzp.orders.fetch(orderId),
    ]);

    const notes = rzpOrder?.notes || {};

    // The order must be one we opened, for this purpose, for this client.
    // Without all three, a valid signature from an unrelated payment — a
    // wallet top-up, or somebody else's order — would settle this one.
    if (
      notes.purpose !== 'legal_service' ||
      !notes.orderId ||
      String(notes.userId || '') !== String(session.id)
    ) {
      console.warn('service order verify: order mismatch', { orderId, user: session.id });
      return NextResponse.json({ error: 'Payment could not be verified.' }, { status: 400 });
    }

    if (payment?.order_id !== orderId) {
      return NextResponse.json({ error: 'Payment could not be verified.' }, { status: 400 });
    }

    // 'authorized' means the money is held but not taken — that happens on
    // manual capture. Treat it as not yet paid rather than starting work
    // against money we may never receive; the webhook finishes the job.
    if (payment?.status !== 'captured') {
      return NextResponse.json(
        {
          error: 'Payment is still being confirmed. Your order will update shortly.',
          pending: true,
        },
        { status: 202 }
      );
    }

    const settled = await markServiceOrderPaid({
      orderId: notes.orderId,
      paymentId,
      razorpayOrderId: orderId,
      amountPaise: payment.amount,
    });

    if (!settled.ok) {
      return NextResponse.json({ error: settled.error }, { status: settled.status || 400 });
    }

    return NextResponse.json({
      ok: true,
      applied: settled.applied, // false when the webhook got there first
      order: serializeOrder(settled.order),
    });
  } catch (err) {
    console.error('service order verify error', err);
    return NextResponse.json(
      {
        error:
          'We could not confirm the payment. If money was deducted your order will be updated shortly.',
      },
      { status: 502 }
    );
  }
}
