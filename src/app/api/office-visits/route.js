import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getSession } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { getUserById } from '@/lib/users';
import { getRazorpay, toPaise } from '@/lib/razorpay';
import { getPaymentConfig } from '@/lib/paymentSettings';
import { takenSlots } from '@/lib/officeVisits';
import { inPersonOffer, slotsForDate, bookableDates, todayIST } from '@/utils/officeTiming';
import Advocate from '@/models/Advocate';
import OfficeVisit from '@/models/OfficeVisit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/office-visits?advocateId=…&date=YYYY-MM-DD
 *
 * The slots already booked with this lawyer on that date, so the picker can
 * grey them out. Public: it says only which times are gone, never who by.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const advocateId = searchParams.get('advocateId') || '';
  const date = searchParams.get('date') || '';
  if (!mongoose.isValidObjectId(advocateId) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ taken: [] });
  }
  return NextResponse.json({ taken: await takenSlots(advocateId, date) });
}

/**
 * POST /api/office-visits  { advocateId, date, time, note }
 *
 * Step 1 of booking an in-person visit: check the slot against the lawyer's
 * own office hours and existing bookings, record the visit as `pending`, and
 * open a Razorpay order for the fee. The fee always comes from the lawyer's
 * record, never from the request. Nothing is booked until the payment is
 * verified (/api/office-visits/verify, or the webhook).
 */
export async function POST(request) {
  const session = await getSession();
  if (!session || session.role !== 'user') {
    return NextResponse.json({ error: 'Please sign in as a client to book a visit.' }, { status: 401 });
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

  const advocateId = String(body?.advocateId || '');
  const date = String(body?.date || '');
  const time = String(body?.time || '');
  const note = String(body?.note || '').trim().slice(0, 500);

  if (!mongoose.isValidObjectId(advocateId)) {
    return NextResponse.json({ error: 'Lawyer not found.' }, { status: 404 });
  }

  try {
    await connectDB();
    const [advocate, user] = await Promise.all([
      Advocate.findById(advocateId)
        .select('name legalCareId consultationFee office timing')
        .lean(),
      getUserById(session.id),
    ]);
    if (!advocate) return NextResponse.json({ error: 'Lawyer not found.' }, { status: 404 });
    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    const offer = inPersonOffer(advocate);
    if (!offer.available) {
      return NextResponse.json(
        { error: 'This lawyer is not taking in-person visits right now.' },
        { status: 409 }
      );
    }

    // The slot must be one the lawyer's own hours offer, on a date inside the
    // booking window — the same rules the picker used, re-applied here.
    if (!bookableDates(offer.timing, todayIST()).includes(date) || !slotsForDate(offer.timing, date).includes(time)) {
      return NextResponse.json({ error: 'That time is outside the office hours. Pick another slot.' }, { status: 400 });
    }
    if ((await takenSlots(advocateId, date)).includes(time)) {
      return NextResponse.json({ error: 'That slot has just been booked. Pick another time.' }, { status: 409 });
    }

    const visit = await OfficeVisit.create({
      userId: session.id,
      userName: user.name || '',
      userEmail: user.email || '',
      userPhone: user.phone || '',
      advocateId,
      advocateName: advocate.name || '',
      legalCareId: advocate.legalCareId || '',
      office: offer.office,
      date,
      time,
      note,
      amount: offer.fee,
    });

    const rzp = await getRazorpay();
    const order = await rzp.orders.create({
      amount: toPaise(offer.fee),
      currency: 'INR',
      receipt: `v_${String(visit._id).slice(-12)}_${Date.now().toString(36)}`,
      // Read back by the webhook, which has no session.
      notes: {
        purpose: 'office_visit',
        visitId: String(visit._id),
        userId: String(session.id),
        advocateId,
      },
    });

    await OfficeVisit.updateOne({ _id: visit._id }, { $set: { razorpayOrderId: order.id } });

    return NextResponse.json({
      visitId: String(visit._id),
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: config.keyId,
      prefill: { name: user.name || '', email: user.email || '', contact: user.phone || '' },
    });
  } catch (err) {
    console.error('office visit order error', err);
    return NextResponse.json({ error: 'Could not start the booking. Please try again.' }, { status: 502 });
  }
}
