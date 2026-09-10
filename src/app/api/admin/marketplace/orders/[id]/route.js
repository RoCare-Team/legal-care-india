import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { connectDB } from '@/lib/db';
import ServiceOrder from '@/models/ServiceOrder';
import { cancelServiceOrder } from '@/lib/legalServices';

export const dynamic = 'force-dynamic';

/**
 * Where an order can go from where it is.
 *
 * An explicit table rather than "any status to any status", because two of
 * those moves are lies about money: an order cannot be walked backwards out of
 * `paid`, and `pending` is not somewhere an admin can put an order — it means
 * "checkout is open", which is a fact about a client's browser, not a decision.
 */
const TRANSITIONS = {
  paid: ['inProgress', 'completed', 'refunded'],
  inProgress: ['completed', 'refunded'],
  completed: ['refunded'],
  pending: ['cancelled'],
  cancelled: [],
  refunded: [],
};

/**
 * PATCH /api/admin/marketplace/orders/[id]  { status, adminNotes }
 *
 * Moving an order through the work queue, and the private notes that go with
 * it. `refunded` records that money went back; it does not send any — refunds
 * are issued from the Razorpay dashboard, and pretending otherwise here would
 * mark an order refunded that nobody had actually paid out.
 */
export async function PATCH(request, { params }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const status = String(body?.status || '').trim();
  const hasNotes = typeof body?.adminNotes === 'string';

  if (!status && !hasNotes) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  }

  try {
    await connectDB();
    const order = await ServiceOrder.findById(id);
    if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });

    if (status) {
      const allowed = TRANSITIONS[order.status] || [];
      if (!allowed.includes(status)) {
        return NextResponse.json(
          { error: `An order that is ${order.status} cannot be marked ${status}.` },
          { status: 400 }
        );
      }
      if (status === 'cancelled') {
        // Through the shared path, not by setting the field: a pending order
        // may be holding wallet money, and only that path gives it back.
        const result = await cancelServiceOrder({ orderId: order._id });
        if (!result.ok) {
          return NextResponse.json({ error: result.error }, { status: result.status || 400 });
        }
        order.status = 'cancelled';
        order.cancelledAt = new Date();
        order.walletHeld = false;
      } else {
        order.status = status;
        if (status === 'completed') order.completedAt = new Date();
      }
    }

    if (hasNotes) order.adminNotes = String(body.adminNotes).slice(0, 4000);

    await order.save();

    return NextResponse.json({
      ok: true,
      order: {
        id: String(order._id),
        reference: order.reference,
        status: order.status,
        adminNotes: order.adminNotes,
        completedAt: order.completedAt,
      },
    });
  } catch (err) {
    console.error('admin service order update error', err);
    return NextResponse.json({ error: 'Could not update that order.' }, { status: 500 });
  }
}
