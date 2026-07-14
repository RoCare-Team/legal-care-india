import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserById } from '@/lib/users';
import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';
import { getPlan } from '@/constants/consultationPlans';
import {
  createConsultation, getAdvocateInbox, markAdvocateOnline, isAdvocateOnline,
} from '@/lib/consultations';

/**
 * GET /api/consultations — advocate's incoming feed (pending + active).
 * Polled by the global call listener; also serves as the presence heartbeat.
 */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'advocate') {
    return NextResponse.json({ sessions: [] }, { status: session ? 200 : 401 });
  }
  // Being here (listener polling) means the advocate is available.
  await markAdvocateOnline(session.id);
  const sessions = await getAdvocateInbox(session.id);
  return NextResponse.json({ sessions });
}

/**
 * POST /api/consultations  { advocateId, planId }
 * A signed-in user books a consultation. Creates a pending request (charged
 * only when the advocate accepts). Rejects up front if the wallet can't cover it.
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
  const plan = getPlan(String(body?.planId || ''));
  if (!advocateId || !plan) {
    return NextResponse.json({ error: 'Invalid booking details.' }, { status: 400 });
  }

  await connectDB();
  const [user, advocate] = await Promise.all([
    getUserById(session.id),
    Advocate.findById(advocateId).select('name').lean(),
  ]);
  if (!advocate) return NextResponse.json({ error: 'Advocate not found.' }, { status: 404 });

  // The advocate must be online to take a live consultation right now.
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
    userName: user.name,
    advocateId,
    advocateName: advocate.name,
    minutes: plan.minutes,
    price: plan.price,
  });

  return NextResponse.json({ ok: true, session: created }, { status: 201 });
}
