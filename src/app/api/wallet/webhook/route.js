import { NextResponse } from 'next/server';
import { creditWalletForPayment } from '@/lib/users';
import { grantMembership } from '@/lib/membership';
import { markServiceOrderPaid } from '@/lib/legalServices';
import { verifyWebhookSignature, hasWebhookSecret, toRupees } from '@/lib/razorpay';

export const dynamic = 'force-dynamic';

/**
 * POST /api/wallet/webhook — Razorpay server-to-server callback.
 *
 * The safety net, for all three things this site charges for. The matching
 * /verify routes only run if the payer's browser survives long enough to come
 * back from checkout; a closed tab or a dead connection would otherwise mean
 * money taken and no balance added, a lawyer charged for a plan they never
 * received, or a client charged for a service that was never opened. Razorpay
 * retries this endpoint until it gets a 2xx, and a wallet credit, a membership
 * and a service order are all keyed on the payment id, so whichever path
 * arrives first wins and the other is a no-op.
 *
 * Which of the three a payment is comes off `notes.purpose`, set when the
 * order was opened — the one place that knows what the money was for.
 *
 * Configure in the dashboard for the `payment.captured` event and set
 * paste the same secret into /admin/payments. There is no session here — the
 * signature is the only authentication, so an unverified body is dropped.
 */
export async function POST(request) {
  if (!(await hasWebhookSecret())) {
    // Not configured; nothing to verify against, so refuse rather than trust.
    return NextResponse.json({ error: 'Webhook not configured.' }, { status: 503 });
  }

  // The signature covers the exact bytes sent, so the body must be read raw —
  // re-serialising parsed JSON would change the digest.
  const raw = await request.text();
  const signature = request.headers.get('x-razorpay-signature') || '';

  if (!(await verifyWebhookSignature(raw, signature))) {
    console.warn('razorpay webhook: bad signature');
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
  }

  if (event?.event !== 'payment.captured') {
    // Anything else (failures, refunds, order.paid) is acknowledged and
    // ignored — a non-2xx would make Razorpay retry it forever.
    return NextResponse.json({ ok: true, ignored: event?.event || 'unknown' });
  }

  const payment = event?.payload?.payment?.entity;
  const paymentId = payment?.id;
  const purpose = payment?.notes?.purpose;

  if (!payment || !paymentId) {
    return NextResponse.json({ ok: true, ignored: 'no payment on event' });
  }

  if (purpose === 'membership') {
    try {
      const result = await grantMembership({
        advocateId: payment.notes?.advocateId,
        planId: payment.notes?.planId,
        paymentId,
        orderId: payment.order_id || '',
        amountPaise: payment.amount,
      });
      // A rejected payment is answered 2xx on purpose: it will be rejected the
      // same way every retry, and Razorpay would keep sending it forever.
      if (!result.ok) {
        console.warn('razorpay webhook: membership refused', { paymentId, error: result.error });
        return NextResponse.json({ ok: true, ignored: result.error });
      }
      return NextResponse.json({ ok: true, membership: result.planId, applied: result.applied });
    } catch (err) {
      console.error('razorpay webhook: membership error', err);
      // 500 so Razorpay retries — a transient DB blip must not cost a lawyer
      // the plan they have already paid for.
      return NextResponse.json({ error: 'Could not process.' }, { status: 500 });
    }
  }

  if (purpose === 'legal_service') {
    try {
      const result = await markServiceOrderPaid({
        orderId: payment.notes?.orderId,
        paymentId,
        razorpayOrderId: payment.order_id || '',
        amountPaise: payment.amount,
      });
      // Refusals are answered 2xx on purpose: the same payment would be
      // refused identically on every retry, and Razorpay would keep sending
      // it forever.
      if (!result.ok) {
        console.warn('razorpay webhook: service order refused', {
          paymentId,
          error: result.error,
        });
        return NextResponse.json({ ok: true, ignored: result.error });
      }
      return NextResponse.json({ ok: true, applied: result.applied });
    } catch (err) {
      console.error('razorpay webhook: service order error', err);
      // 500 so Razorpay retries — a transient DB blip must not cost a client
      // the order they have already paid for.
      return NextResponse.json({ error: 'Could not process.' }, { status: 500 });
    }
  }

  const userId = payment?.notes?.userId;
  if (!userId || purpose !== 'wallet_topup') {
    return NextResponse.json({ ok: true, ignored: 'not a wallet top-up' });
  }

  try {
    const { user, credited } = await creditWalletForPayment({
      userId,
      amount: toRupees(payment.amount),
      paymentId,
      orderId: payment.order_id || '',
      note: 'Added to wallet',
    });
    if (!user) console.warn('razorpay webhook: unknown user', { userId, paymentId });
    return NextResponse.json({ ok: true, credited });
  } catch (err) {
    console.error('razorpay webhook error', err);
    // 500 so Razorpay retries — a transient DB blip shouldn't lose the credit.
    return NextResponse.json({ error: 'Could not process.' }, { status: 500 });
  }
}
