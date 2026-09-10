import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserById } from '@/lib/users';
import { getRazorpay, toPaise } from '@/lib/razorpay';
import { getPaymentConfig } from '@/lib/paymentSettings';
import {
  cancelServiceOrder,
  createServiceOrder,
  listOrdersForUser,
  markServiceOrderPaidByWallet,
  serializeOrder,
} from '@/lib/legalServices';
import ServiceOrder from '@/models/ServiceOrder';

export const dynamic = 'force-dynamic';

/** GET /api/marketplace/orders — the signed-in client's own orders. */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'user') {
    return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  }

  try {
    return NextResponse.json({ orders: await listOrdersForUser(session.id) });
  } catch (err) {
    console.error('service orders list error', err);
    return NextResponse.json({ error: 'Could not load your orders.' }, { status: 500 });
  }
}

/**
 * POST /api/marketplace/orders
 *   { slug, couponCode, useWallet, address:{...}, notes }
 *
 * Step 1 of buying a service: price it from the catalogue, open the order, and
 * hand back either a Razorpay order to pay, or a finished order when the
 * wallet covered the whole thing.
 *
 * The amount sent to Razorpay is the one this server computed. Nothing in the
 * request body reaches it — the client chooses *what* to buy and whether to
 * spend their wallet, and that is all.
 */
export async function POST(request) {
  const session = await getSession();
  if (!session || session.role !== 'user') {
    return NextResponse.json({ error: 'Please sign in to place an order.' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const slug = String(body?.slug || '').trim();
  if (!slug) return NextResponse.json({ error: 'Which service?' }, { status: 400 });

  const created = await createServiceOrder({
    userId: session.id,
    slug,
    couponCode: body?.couponCode || '',
    useWallet: Boolean(body?.useWallet),
    address: body?.address || {},
    notes: body?.notes || '',
  });

  if (!created.ok) {
    return NextResponse.json({ error: created.error }, { status: created.status || 400 });
  }

  const order = created.order;

  // Paid outright from the wallet. There is nothing to collect, so no
  // checkout is opened at all — sending the client to Razorpay for ₹0 would
  // fail there rather than here.
  if (order.amounts.razorpayAmount <= 0) {
    const settled = await markServiceOrderPaidByWallet(order._id);
    return NextResponse.json({
      order: serializeOrder(settled.order),
      paid: true,
    });
  }

  const config = await getPaymentConfig();
  if (!config.keyId || !config.keySecret) {
    // Nothing can be collected, so the hold must not be left standing.
    await cancelServiceOrder({ orderId: order._id, userId: session.id });
    return NextResponse.json(
      { error: 'Online payments are not set up yet. Please try again later.' },
      { status: 503 }
    );
  }

  try {
    const user = await getUserById(session.id);
    const rzp = await getRazorpay();

    const rzpOrder = await rzp.orders.create({
      amount: toPaise(order.amounts.razorpayAmount),
      currency: 'INR',
      // Razorpay caps receipts at 40 characters; the reference is short and is
      // what an admin will search for when a client quotes it.
      receipt: order.reference,
      // Kept on the order server-side so the webhook — which has no session —
      // still knows which of our orders a payment settles.
      notes: {
        purpose: 'legal_service',
        orderId: String(order._id),
        userId: String(session.id),
      },
    });

    await ServiceOrder.updateOne(
      { _id: order._id },
      { $set: { razorpayOrderId: rzpOrder.id } }
    );
    order.razorpayOrderId = rzpOrder.id;

    return NextResponse.json({
      order: serializeOrder(order),
      paid: false,
      checkout: {
        orderId: rzpOrder.id,
        amount: rzpOrder.amount, // paise, straight from Razorpay
        currency: rzpOrder.currency,
        // Sent from here rather than a NEXT_PUBLIC_ env var, so rotating the
        // key in /admin takes effect on the very next checkout.
        keyId: config.keyId,
        prefill: {
          name: order.address?.name || user?.name || '',
          email: order.address?.email || user?.email || '',
          contact: order.address?.phone || user?.phone || '',
        },
      },
    });
  } catch (err) {
    console.error('service order: razorpay order failed', err);
    // Checkout never opened, so the wallet hold has to go back.
    await cancelServiceOrder({ orderId: order._id, userId: session.id });
    return NextResponse.json(
      { error: 'Could not start the payment. Please try again.' },
      { status: 502 }
    );
  }
}
