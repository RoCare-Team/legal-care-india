import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { creditWalletForPayment } from '@/lib/users';
import { getRazorpay, isRazorpayConfigured, verifyPaymentSignature, toRupees } from '@/lib/razorpay';

export const dynamic = 'force-dynamic';

/**
 * POST /api/wallet/verify
 *   { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 *
 * Step 2 of a top-up. Three things are checked before a single rupee is added,
 * because everything in the request body came from the browser:
 *
 *   1. the signature really was produced with our key secret;
 *   2. Razorpay itself reports the payment as captured, for that order;
 *   3. the order belongs to the signed-in user, and the amount is the amount
 *      Razorpay says was paid — never a number the client sent.
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
    console.warn('wallet verify: bad signature', { orderId, paymentId, user: session.id });
    return NextResponse.json({ error: 'Payment could not be verified.' }, { status: 400 });
  }

  try {
    const rzp = await getRazorpay();
    const [payment, order] = await Promise.all([
      rzp.payments.fetch(paymentId),
      rzp.orders.fetch(orderId),
    ]);

    // The order must be one we opened for *this* user. Without this, a valid
    // signature from someone else's payment would credit the wrong wallet.
    if (String(order?.notes?.userId || '') !== String(session.id)) {
      console.warn('wallet verify: order/user mismatch', { orderId, user: session.id });
      return NextResponse.json({ error: 'Payment could not be verified.' }, { status: 400 });
    }

    if (payment?.order_id !== orderId) {
      return NextResponse.json({ error: 'Payment could not be verified.' }, { status: 400 });
    }

    // 'authorized' means the money is held but not taken — that happens when
    // the account is on manual capture. Treat it as not-yet-paid rather than
    // crediting against money we may never receive; the webhook will finish
    // the job once it is captured.
    if (payment?.status !== 'captured') {
      return NextResponse.json(
        { error: 'Payment is still being confirmed. Your balance will update shortly.', pending: true },
        { status: 202 }
      );
    }

    const rupees = toRupees(payment.amount);

    const { user, credited } = await creditWalletForPayment({
      userId: session.id,
      amount: rupees,
      paymentId,
      orderId,
      note: 'Added to wallet',
    });

    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    return NextResponse.json({
      ok: true,
      credited, // false when the webhook got there first — not an error
      balance: user.walletBalance,
      transactions: user.walletTransactions,
    });
  } catch (err) {
    console.error('wallet verify error', err);
    return NextResponse.json(
      { error: 'We could not confirm the payment. If money was deducted it will be credited shortly.' },
      { status: 502 }
    );
  }
}
