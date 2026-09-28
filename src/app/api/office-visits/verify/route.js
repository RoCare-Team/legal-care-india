import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { markVisitPaid } from '@/lib/officeVisits';
import { getRazorpay, isRazorpayConfigured, verifyPaymentSignature } from '@/lib/razorpay';

export const dynamic = 'force-dynamic';

/**
 * POST /api/office-visits/verify
 *   { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 *
 * Step 2 of booking a visit — the same three checks as a wallet top-up: the
 * signature is ours, Razorpay reports the payment captured for that order,
 * and the order was opened for this client. Only then is the slot taken.
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
    console.warn('office visit verify: bad signature', { orderId, paymentId, user: session.id });
    return NextResponse.json({ error: 'Payment could not be verified.' }, { status: 400 });
  }

  try {
    const rzp = await getRazorpay();
    const [payment, order] = await Promise.all([
      rzp.payments.fetch(paymentId),
      rzp.orders.fetch(orderId),
    ]);

    if (
      order?.notes?.purpose !== 'office_visit' ||
      String(order?.notes?.userId || '') !== String(session.id) ||
      payment?.order_id !== orderId
    ) {
      console.warn('office visit verify: order mismatch', { orderId, user: session.id });
      return NextResponse.json({ error: 'Payment could not be verified.' }, { status: 400 });
    }

    if (payment?.status !== 'captured') {
      return NextResponse.json(
        { error: 'Payment is still being confirmed. Your booking will be confirmed shortly.', pending: true },
        { status: 202 }
      );
    }

    const result = await markVisitPaid({
      visitId: order.notes.visitId,
      paymentId,
      razorpayOrderId: orderId,
      amountPaise: payment.amount,
    });
    if (!result.ok) {
      console.warn('office visit verify: refused', { orderId, error: result.error });
      return NextResponse.json(
        { error: 'Payment received but the booking could not be confirmed. Our team will contact you.' },
        { status: 409 }
      );
    }

    return NextResponse.json({ ok: true, visit: result.visit });
  } catch (err) {
    console.error('office visit verify error', err);
    return NextResponse.json(
      { error: 'We could not confirm the payment. If money was deducted, your booking will be confirmed shortly.' },
      { status: 502 }
    );
  }
}
