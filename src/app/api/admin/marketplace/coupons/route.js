import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { connectDB } from '@/lib/db';
import Coupon from '@/models/Coupon';
import { readCouponFields } from '@/lib/legalServices';

export const dynamic = 'force-dynamic';

/** GET /api/admin/marketplace/coupons — every code, newest first. */
export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

  try {
    await connectDB();
    const coupons = await Coupon.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({
      coupons: coupons.map((c) => ({
        ...c,
        _id: String(c._id),
        id: String(c._id),
        services: (c.services || []).map(String),
      })),
    });
  } catch (err) {
    console.error('admin coupons list error', err);
    return NextResponse.json({ error: 'Could not load coupons.' }, { status: 500 });
  }
}

/** POST /api/admin/marketplace/coupons — create a discount code. */
export async function POST(request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = readCouponFields(body);
  if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    await connectDB();
    if (await Coupon.exists({ code: parsed.values.code })) {
      return NextResponse.json({ error: 'That code already exists.' }, { status: 409 });
    }

    const created = await Coupon.create(parsed.values);
    return NextResponse.json({
      ok: true,
      coupon: { ...created.toObject(), id: String(created._id) },
    });
  } catch (err) {
    console.error('admin coupon create error', err);
    return NextResponse.json({ error: 'Could not save that coupon.' }, { status: 500 });
  }
}
