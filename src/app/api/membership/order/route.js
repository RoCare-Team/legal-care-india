import { NextResponse } from 'next/server';
import { getSessionAdvocateId } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';
import { getRazorpay, toPaise } from '@/lib/razorpay';
import { getPaymentConfig } from '@/lib/paymentSettings';
import { annualTotal, getPlan, PAID_PLANS } from '@/constants/membershipPlans';

export const dynamic = 'force-dynamic';

/**
 * POST /api/membership/order  { planId }
 *
 * Step 1 of buying a membership: open a Razorpay order for a year of `planId`
 * and hand the order id back so the browser can launch checkout.
 *
 * No plan is granted here and nothing is written to the lawyer's account. The
 * membership only moves in /api/membership/verify, after the payment has been
 * proved — and the price is computed here from the plan table rather than read
 * from the request, so a browser cannot name its own price for Premium.
 */
export async function POST(request) {
  const advocateId = await getSessionAdvocateId();
  if (!advocateId) {
    return NextResponse.json(
      { error: 'Please sign in as a lawyer to change your plan.' },
      { status: 401 }
    );
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

  const planId = String(body?.planId || '').trim();
  // Only a plan somebody can actually buy — Starter is what you get for not
  // paying, so there is nothing to open an order for.
  if (!PAID_PLANS.some((p) => p.id === planId)) {
    return NextResponse.json({ error: 'Choose a plan to continue.' }, { status: 400 });
  }

  const plan = getPlan(planId);
  const price = annualTotal(planId);

  try {
    await connectDB();
    const advocate = await Advocate.findById(advocateId)
      .select('name email phone')
      .lean();
    if (!advocate) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }

    const rzp = await getRazorpay();
    const order = await rzp.orders.create({
      amount: toPaise(price.total),
      currency: 'INR',
      // Razorpay caps a receipt at 40 characters.
      receipt: `m_${String(advocateId).slice(-12)}_${Date.now().toString(36)}`,
      // Carried on the order because the webhook has no session: whose
      // membership, and which plan they actually paid for.
      notes: {
        advocateId: String(advocateId),
        planId,
        purpose: 'membership',
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount, // paise, straight from Razorpay
      currency: order.currency,
      // Sent from here rather than a NEXT_PUBLIC_ env var, so rotating the key
      // in /admin takes effect on the very next checkout.
      keyId: config.keyId,
      plan: { id: plan.id, name: plan.name },
      // The same breakdown the pricing page showed, so the checkout sheet and
      // the page it was opened from cannot quote different numbers.
      price,
      prefill: {
        name: advocate.name || '',
        email: advocate.email || '',
        contact: advocate.phone || '',
      },
    });
  } catch (err) {
    console.error('membership order error', err);
    return NextResponse.json(
      { error: 'Could not start the payment. Please try again.' },
      { status: 502 }
    );
  }
}
