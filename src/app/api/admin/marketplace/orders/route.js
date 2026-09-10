import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { connectDB } from '@/lib/db';
import ServiceOrder from '@/models/ServiceOrder';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/marketplace/orders?status=&q=&page=&perPage=
 *
 * The work queue. Paid orders first by default rather than every order ever
 * placed — an admin opens this to see what has to be done, and a list led by
 * abandoned checkouts buries that.
 *
 * `q` matches the reference, the client's name and the service title, which is
 * the three things a client could quote down a phone line.
 */
export async function GET(request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || '';
  const q = (searchParams.get('q') || '').trim();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const perPage = Math.min(100, Math.max(1, Number(searchParams.get('perPage')) || 25));

  const filter = {};
  if (status === 'all') {
    // everything
  } else if (status) {
    filter.status = status;
  } else {
    // The default view is work, not history: pending orders are checkouts that
    // may still complete and cancelled ones are noise.
    filter.status = { $in: ['paid', 'inProgress'] };
  }

  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ reference: rx }, { 'address.name': rx }, { serviceTitle: rx }];
  }

  try {
    await connectDB();
    const [rows, total] = await Promise.all([
      ServiceOrder.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * perPage)
        .limit(perPage)
        .lean(),
      ServiceOrder.countDocuments(filter),
    ]);

    return NextResponse.json({
      orders: rows.map((o) => ({
        id: String(o._id),
        reference: o.reference,
        status: o.status,
        service: { title: o.serviceTitle, slug: o.serviceSlug, category: o.serviceCategory || '' },
        amounts: o.amounts || {},
        // Wallet money this order is owed — non-zero only where a swept order
        // was paid after its hold had gone back and been spent elsewhere. It
        // is here because it is a debt somebody has to chase, and nothing
        // chases it if nothing shows it.
        walletShortfall: o.walletShortfall || 0,
        couponCode: o.couponCode || '',
        address: o.address || {},
        notes: o.notes || '',
        adminNotes: o.adminNotes || '',
        razorpayOrderId: o.razorpayOrderId || '',
        razorpayPaymentId: o.razorpayPaymentId || '',
        createdAt: o.createdAt,
        paidAt: o.paidAt,
        completedAt: o.completedAt,
      })),
      total,
      page,
      perPage,
      pages: Math.max(1, Math.ceil(total / perPage)),
    });
  } catch (err) {
    console.error('admin service orders error', err);
    return NextResponse.json({ error: 'Could not load orders.' }, { status: 500 });
  }
}
