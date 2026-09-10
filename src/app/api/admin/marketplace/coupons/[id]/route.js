import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { connectDB } from '@/lib/db';
import Coupon from '@/models/Coupon';
import ServiceOrder from '@/models/ServiceOrder';
import { readCouponFields } from '@/lib/legalServices';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/marketplace/coupons/[id] — edit a code's terms.
 *
 * The code itself is not editable; `readCouponFields` leaves it out on a
 * partial read. Renaming a live code would detach it from every order already
 * placed under it, since orders record the code as text.
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

  const parsed = readCouponFields(body, { partial: true });
  if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    await connectDB();
    const coupon = await Coupon.findByIdAndUpdate(id, parsed.values, { new: true });
    if (!coupon) return NextResponse.json({ error: 'Coupon not found.' }, { status: 404 });

    return NextResponse.json({
      ok: true,
      coupon: { ...coupon.toObject(), id: String(coupon._id) },
    });
  } catch (err) {
    console.error('admin coupon update error', err);
    return NextResponse.json({ error: 'Could not save that coupon.' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/marketplace/coupons/[id]
 *
 * A code that has been redeemed is deactivated rather than deleted. Orders
 * name the code they used, and an admin looking at "SAVE20" on a six-month-old
 * invoice needs to be able to look up what it meant.
 */
export async function DELETE(request, { params }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

  const { id } = await params;

  try {
    await connectDB();
    const coupon = await Coupon.findById(id);
    if (!coupon) return NextResponse.json({ error: 'Coupon not found.' }, { status: 404 });

    const used = await ServiceOrder.exists({ couponCode: coupon.code });
    if (used) {
      coupon.active = false;
      await coupon.save();
      return NextResponse.json({
        ok: true,
        deactivated: true,
        message: 'This code has been used, so it was switched off rather than deleted.',
      });
    }

    await coupon.deleteOne();
    return NextResponse.json({ ok: true, deleted: true });
  } catch (err) {
    console.error('admin coupon delete error', err);
    return NextResponse.json({ error: 'Could not remove that coupon.' }, { status: 500 });
  }
}
