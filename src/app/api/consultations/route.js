import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserById } from '@/lib/users';
import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';
import { getAdvocatePlan } from '@/constants/consultationPlans';
import {
  createConsultation, getAdvocateInbox, markAdvocateOnline, isAdvocateOnline,
} from '@/lib/consultations';

/**
 * GET /api/consultations — lawyer's incoming feed (pending + active).
 * Polled by the global call listener; also serves as the presence heartbeat.
 */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'advocate') {
    return NextResponse.json({ sessions: [] }, { status: session ? 200 : 401 });
  }
  // Being here (listener polling) means the lawyer is available.
  await markAdvocateOnline(session.id);
  const sessions = await getAdvocateInbox(session.id);
  return NextResponse.json({ sessions });
}

/**
 * POST /api/consultations  { advocateId, planId }
 * A signed-in user books a consultation. Creates a pending request (charged
 * only when the lawyer accepts). Rejects up front if the wallet can't cover it.
 */
export async function POST(request) {
  const session = await getSession();
  if (!session || session.role !== 'user') {
    return NextResponse.json({ error: 'Please sign in as a user to book.' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const advocateId = String(body?.advocateId || '').trim();
  const minutes = Number(body?.minutes);
  if (!advocateId || !Number.isFinite(minutes)) {
    return NextResponse.json({ error: 'Invalid booking details.' }, { status: 400 });
  }

  await connectDB();
  const [user, advocate] = await Promise.all([
    getUserById(session.id),
    Advocate.findById(advocateId).select('name consultationPlans').lean(),
  ]);
  if (!advocate) return NextResponse.json({ error: 'Lawyer not found.' }, { status: 404 });

  // The plan (duration + price) always comes from the lawyer's own list —
  // never from the client.
  const plan = getAdvocatePlan(advocate.consultationPlans, minutes);
  if (!plan) {
    return NextResponse.json(
      { error: 'This lawyer does not offer that consultation plan.' },
      { status: 400 }
    );
  }

  // The lawyer must be online to take a live consultation right now.
  if (!(await isAdvocateOnline(advocateId))) {
    return NextResponse.json(
      { error: 'offline', message: `${advocate.name} is offline right now. Please try again later.` },
      { status: 409 }
    );
  }

  if ((user?.walletBalance || 0) < plan.price) {
    return NextResponse.json(
      { error: 'insufficient', message: `You need ₹${plan.price} in your wallet. Add money and try again.` },
      { status: 402 }
    );
  }

  const created = await createConsultation({
    userId: session.id,
    // The lawyer sees "Anonymous" if the user turned that on in their account.
    userName: user.anonymous ? 'Anonymous' : user.name,
    advocateId,
    advocateName: advocate.name,
    minutes: plan.minutes,
    price: plan.price,
  });

  return NextResponse.json({ ok: true, session: created }, { status: 201 });
}
