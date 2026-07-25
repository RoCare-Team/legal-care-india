import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserById } from '@/lib/users';
import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';
import { getAdvocatePlan } from '@/constants/consultationPlans';
import { bridgeAudioCall } from '@/lib/phoneBridge';
import {
  createConsultation, resumeConsultation, getAdvocateInbox,
  markAdvocateOnline, isAdvocateOnline, cancelConsultation,
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
  // A resume reconnects leftover time from an earlier session — no plan, no
  // charge — so it takes a different path from a fresh booking.
  const resumeFrom = String(body?.resumeFrom || '').trim();
  const minutes = Number(body?.minutes);
  if (!advocateId || (!resumeFrom && !Number.isFinite(minutes))) {
    return NextResponse.json({ error: 'Invalid booking details.' }, { status: 400 });
  }

  // 'video' and 'audio' each bill from the lawyer's own separate plan list;
  // anything else is a chat.
  const type = ['video', 'audio'].includes(body?.type) ? body.type : 'chat';

  await connectDB();
  const [user, advocate] = await Promise.all([
    getUserById(session.id),
    Advocate.findById(advocateId)
      .select('name consultationPlans videoPlans audioPlans phone contact')
      .lean(),
  ]);
  if (!advocate) return NextResponse.json({ error: 'Lawyer not found.' }, { status: 404 });

  // A lawyer who has switched themselves offline is not taking anything —
  // chat, video or phone — and a resume needs them just as much as a fresh
  // booking does.
  if (!(await isAdvocateOnline(advocateId))) {
    return NextResponse.json(
      { error: 'offline', message: `${advocate.name} is offline right now. Please try again later.` },
      { status: 409 }
    );
  }

  // ── Free resume of leftover time ─────────────────────────────────────────
  if (resumeFrom) {
    try {
      const resumed = await resumeConsultation({
        userId: session.id,
        userName: user.anonymous ? 'Anonymous' : user.name,
        advocateId,
        advocateName: advocate.name,
        fromId: resumeFrom,
      });

      // Leftover phone minutes come back as a phone call: ring them again, on
      // the same terms as the paid call this time was bought with.
      if (resumed?.type === 'audio') {
        const bridged = await bridgeAudioCall({ userId: session.id, advocateId });
        if (!bridged.ok) {
          await cancelConsultation(resumed.id, session.id).catch(() => {});
          return NextResponse.json(
            { error: 'call-failed', message: bridged.error },
            { status: bridged.status }
          );
        }
      }

      return NextResponse.json({ ok: true, session: resumed }, { status: 201 });
    } catch (err) {
      if (err.code === 'NOT_FOUND') {
        return NextResponse.json({ error: 'That session no longer exists.' }, { status: 404 });
      }
      if (err.code === 'BAD_STATE') {
        return NextResponse.json(
          { error: 'expired', message: 'This leftover time is no longer available. Please book again.' },
          { status: 409 }
        );
      }
      console.error('resume consultation error', err);
      return NextResponse.json({ error: 'Could not resume. Please try again.' }, { status: 500 });
    }
  }

  // ── Fresh paid booking (chat or video) ───────────────────────────────────
  // The plan (duration + price) always comes from the lawyer's own list —
  // never from the client — picking the chat or video list by `type`.
  const planList =
    type === 'video' ? advocate.videoPlans
      : type === 'audio' ? advocate.audioPlans
        : advocate.consultationPlans;
  const plan = getAdvocatePlan(planList, minutes);
  if (!plan) {
    const label = type === 'video' ? 'video call' : type === 'audio' ? 'audio call' : 'consultation';
    return NextResponse.json(
      { error: `This lawyer does not offer that ${label} plan.` },
      { status: 400 }
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
    type,
  });

  // ── Audio: dial straight away, no accept step ────────────────────────────
  // The lawyer's phone is the accept screen — it rings and they either pick up
  // or they don't. The session stays PENDING and free while it rings: the
  // wallet is charged only once Smartflo confirms the call was answered, which
  // the GET route checks on each poll. A declined call must cost nothing.
  if (type === 'audio') {
    const bridged = await bridgeAudioCall({ userId: session.id, advocateId });
    if (!bridged.ok) {
      await cancelConsultation(created.id, session.id).catch(() => {});
      return NextResponse.json(
        { error: 'call-failed', message: bridged.error },
        { status: bridged.status }
      );
    }
  }

  return NextResponse.json({ ok: true, session: created }, { status: 201 });
}
