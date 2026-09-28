import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { markReviewPaid, runAiReview, serializeReview } from '@/lib/documentReviews';
import { getRazorpay, isRazorpayConfigured, verifyPaymentSignature } from '@/lib/razorpay';

export const dynamic = 'force-dynamic';
// An AI read of a long PDF can take the better part of a minute.
export const maxDuration = 120;

/**
 * POST /api/document-review/verify
 *   { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 *
 * Step 2: prove the payment (signature, captured, this client's order), mark
 * the review paid, and — for an AI review — run the read straight away and
 * return the findings. A lawyer review simply joins the queue.
 */
export async function POST(request) {
  const session = await getSession();
  if (!session || session.role !== 'user') return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  if (!(await isRazorpayConfigured())) return NextResponse.json({ error: 'Payments are not configured.' }, { status: 503 });

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
    return NextResponse.json({ error: 'Payment could not be verified.' }, { status: 400 });
  }

  try {
    const rzp = await getRazorpay();
    const [payment, order] = await Promise.all([rzp.payments.fetch(paymentId), rzp.orders.fetch(orderId)]);
    if (
      order?.notes?.purpose !== 'document_review' ||
      String(order?.notes?.userId || '') !== String(session.id) ||
      payment?.order_id !== orderId
    ) {
      return NextResponse.json({ error: 'Payment could not be verified.' }, { status: 400 });
    }
    if (payment?.status !== 'captured') {
      return NextResponse.json(
        { error: 'Payment is still being confirmed. Your review will start shortly.', pending: true, reviewId: order.notes.reviewId },
        { status: 202 }
      );
    }

    const paid = await markReviewPaid({
      reviewId: order.notes.reviewId, paymentId, razorpayOrderId: orderId, amountPaise: payment.amount,
    });
    if (!paid.ok) {
      console.warn('document review verify refused', { orderId, error: paid.error });
      return NextResponse.json(
        { error: 'Payment received but the review could not be started. Our team will contact you.' },
        { status: 409 }
      );
    }

    const review = paid.review.kind === 'ai' && paid.review.status === 'paid'
      ? await runAiReview(paid.review._id)
      : paid.review;
    return NextResponse.json({ ok: true, review: serializeReview(review) });
  } catch (err) {
    console.error('document review verify error', err);
    return NextResponse.json(
      { error: 'We could not confirm the payment. If money was deducted, your review will appear in your account shortly.' },
      { status: 502 }
    );
  }
}
