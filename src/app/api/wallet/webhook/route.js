import { NextResponse } from 'next/server';
import { creditWalletForPayment } from '@/lib/users';
import { verifyWebhookSignature, hasWebhookSecret, toRupees } from '@/lib/razorpay';

export const dynamic = 'force-dynamic';

/**
 * POST /api/wallet/webhook — Razorpay server-to-server callback.
 *
 * The safety net. /api/wallet/verify only runs if the user's browser survives
 * long enough to come back from checkout; a closed tab or a dead connection
 * would otherwise mean money taken and no balance added. Razorpay retries this
 * endpoint until it gets a 2xx, and crediting is keyed on the payment id, so
 * whichever path arrives first wins and the other is a no-op.
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
  const userId = payment?.notes?.userId;
  const paymentId = payment?.id;

  if (!payment || !paymentId || !userId || payment.notes?.purpose !== 'wallet_topup') {
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
