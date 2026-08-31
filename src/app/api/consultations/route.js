import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserById } from '@/lib/users';
import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';
import { advocateRate, affordableMinutes, formatRate } from '@/constants/callRates';
import { bridgeAudioCall } from '@/lib/phoneBridge';
import {
  createConsultation, resumeConsultation, getAdvocateInbox,
  markAdvocateOnline, isAdvocateOnline, cancelConsultation,
  getUserConsultations, getAdvocateConsultations,
} from '@/lib/consultations';

/**
 * GET /api/consultations — the lawyer's incoming feed (pending + active).
 * Polled by the global call listener; also serves as the presence heartbeat.
 *
 * GET /api/consultations?scope=mine — the caller's own consultation history
 * instead: a client sees the sessions they booked, a lawyer the ones they took.
 * The website renders both of those lists on the server (the account screen and
 * /dashboard/consultations), which is why only the inbox ever needed an
 * endpoint; a phone needs the history as JSON too, and it is the same read from
 * lib/consultations that those pages perform.
 *
 * Which history you get is decided by the session and never by a parameter — a
 * parameter only chooses between "my inbox" and "my history", both of which are
 * already yours. Asking for a history without being signed in is a 401, and
 * asking for the inbox as a client is the empty feed it has always been.
 */
export async function GET(request) {
  const session = await getSession();
  const scope = new URL(request.url).searchParams.get('scope');

  if (scope === 'mine') {
    if (!session) {
      return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });
    }
    const consultations =
      session.role === 'advocate'
        ? await getAdvocateConsultations(session.id)
        : await getUserConsultations(session.id);
    return NextResponse.json(
      { consultations },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  if (!session || session.role !== 'advocate') {
    return NextResponse.json({ sessions: [] }, { status: session ? 200 : 401 });
  }
  // Being here (listener polling) means the lawyer is available.
  await markAdvocateOnline(session.id);
  const sessions = await getAdvocateInbox(session.id);
  return NextResponse.json({ sessions });
}

/**
 * POST /api/consultations  { advocateId, type }
 *
 * A signed-in user books a consultation. Creates a pending request at the
 * lawyer's per-minute rate — no duration is chosen and nothing is charged
 * here. The bill is the minutes the session actually runs, settled when it
 * ends. Rejected up front only if the wallet can't cover a single minute.
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
  if (!advocateId) {
    return NextResponse.json({ error: 'Invalid booking details.' }, { status: 400 });
  }

  // 'video' and 'audio' each bill from the lawyer's own separate plan list;
  // anything else is a chat.
  const type = ['video', 'audio'].includes(body?.type) ? body.type : 'chat';

  await connectDB();
  const [user, advocate] = await Promise.all([
    getUserById(session.id),
    Advocate.findById(advocateId)
      .select('name chatRate audioRate videoRate consultationPlans videoPlans audioPlans phone contact')
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

  // ── Fresh booking (chat, audio or video) ─────────────────────────────────
  // The rate always comes from the lawyer's own profile, never from the
  // client. A rate of 0 means they don't offer this channel at all.
  const rate = advocateRate(advocate, type);
  if (!rate) {
    const label = type === 'video' ? 'video calls' : type === 'audio' ? 'audio calls' : 'live chat';
    return NextResponse.json(
      { error: `This lawyer does not offer ${label}.` },
      { status: 400 }
    );
  }

  // Nothing is charged now — but the wallet has to cover at least the first
  // minute, and what it covers becomes the session's ceiling. Better to say so
  // here than to cut a client off thirty seconds in.
  const maxMinutes = affordableMinutes(user?.walletBalance, rate);
  if (maxMinutes < 1) {
    return NextResponse.json(
      {
        error: 'insufficient',
        message: `This lawyer charges ${formatRate(rate)}. Add at least ₹${rate} to your wallet and try again.`,
      },
      { status: 402 }
    );
  }

  const created = await createConsultation({
    userId: session.id,
    // The lawyer sees "Anonymous" if the user turned that on in their account.
    userName: user.anonymous ? 'Anonymous' : user.name,
    advocateId,
    advocateName: advocate.name,
    rate,
    maxMinutes,
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
