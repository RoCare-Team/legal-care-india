import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserById } from '@/lib/users';
import { getRazorpay, toPaise } from '@/lib/razorpay';
import { getPaymentConfig } from '@/lib/paymentSettings';

export const dynamic = 'force-dynamic';

// ₹50 floor. Razorpay charges a per-transaction fee that barely moves with the
// amount, so a ₹5 top-up costs more to collect than it is worth.
const MIN_TOPUP = 50;
const MAX_TOPUP = 100000; // ₹1,00,000 per top-up — a typo shouldn't cost a crore.

/**
 * POST /api/wallet/order  { amount }
 *
 * Step 1 of a top-up: open a Razorpay order for `amount` rupees and hand the
 * order id back so the browser can launch checkout. No money moves here, and
 * nothing is credited — the wallet only grows in /api/wallet/verify, after the
 * payment has been proved.
 */
export async function POST(request) {
  const session = await getSession();
  if (!session || session.role !== 'user') {
    return NextResponse.json({ error: 'Please sign in to add money.' }, { status: 401 });
  }

  const config = await getPaymentConfig();
  if (!config.keyId || !config.keySecret) {
    return NextResponse.json(
      { error: 'Online payments are not set up yet. Please try again later.' },
      { status: 503 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const amount = Number(body?.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Enter a valid amount.' }, { status: 400 });
  }
  if (amount < MIN_TOPUP) {
    return NextResponse.json(
      { error: `The smallest top-up is ₹${MIN_TOPUP}.` },
      { status: 400 }
    );
  }
  if (amount > MAX_TOPUP) {
    return NextResponse.json(
      { error: `You can add up to ₹${MAX_TOPUP.toLocaleString('en-IN')} at a time.` },
      { status: 400 }
    );
  }

  // Whole rupees only. Razorpay is happy with paise, but a wallet shown as
  // "₹1,558" and a ledger of round numbers shouldn't start carrying 0.37s.
  const rupees = Math.round(amount);

  try {
    const user = await getUserById(session.id);
    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    const rzp = await getRazorpay();
    const order = await rzp.orders.create({
      amount: toPaise(rupees),
      currency: 'INR',
      // Receipts are capped at 40 characters by Razorpay.
      receipt: `w_${String(session.id).slice(-12)}_${Date.now().toString(36)}`,
      // Kept server-side on the order so the webhook — which has no session —
      // still knows whose wallet to credit.
      notes: { userId: String(session.id), purpose: 'wallet_topup' },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount, // paise, straight from Razorpay
      currency: order.currency,
      // Sent from here rather than a NEXT_PUBLIC_ env var, so rotating the
      // key in /admin takes effect on the very next checkout.
      keyId: config.keyId,
      prefill: {
        name: user.name || '',
        email: user.email || '',
        contact: user.phone || '',
      },
    });
  } catch (err) {
    console.error('razorpay order error', err);
    return NextResponse.json(
      { error: 'Could not start the payment. Please try again.' },
      { status: 502 }
    );
  }
}
