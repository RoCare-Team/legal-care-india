import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { checkAudioCall } from '@/lib/phoneBridge';
import {
  getConsultation,
  acceptConsultation,
  rejectConsultation,
  cancelConsultation,
  endConsultation,
  hideConsultationFor,
} from '@/lib/consultations';

/** Only the two participants may read/act on a session. */
function isParticipant(session, s) {
  return (
    (s.role === 'user' && session.userId === String(s.id)) ||
    (s.role === 'advocate' && session.advocateId === String(s.id))
  );
}

/** How long the lawyer's phone may ring before we call it unanswered. */
const RING_TIMEOUT_MS = 90 * 1000;

/**
 * Smartflo is asked at most this often per session. The two participants poll
 * every 2s each; without a floor that would be dozens of provider calls a
 * minute for one ringing phone.
 */
const OUTCOME_CHECK_MS = 4000;
const lastChecked = new Map();

/**
 * An audio consultation lives on the phone network, where nothing reports back
 * on its own — so every poll asks Smartflo where the call actually is and moves
 * the session to match:
 *
 *   pending, answered → charge the plan and start the clock
 *   pending, declined → close it as rejected, with no charge at all
 *   active,  ended    → the handsets hung up, so end the session too
 *   ringing           → leave it alone; it may still connect
 *
 * Ending on hang-up is what leaves the unused minutes on the record, which is
 * what the client gets back as a free resume for the next 24 hours.
 *
 * Anything that fails here leaves the session as it was, which is the safe
 * direction: a caller is never charged for a call we could not confirm.
 */
async function settlePhoneCall(session) {
  const ringing = session.status === 'pending';
  const since = session.createdAt || Date.now();
  const rangFor = Date.now() - new Date(since).getTime();

  const last = lastChecked.get(session.id) || 0;
  if (Date.now() - last < OUTCOME_CHECK_MS) return session;
  lastChecked.set(session.id, Date.now());

  let outcome = { state: 'ringing', seconds: 0 };
  try {
    outcome = await checkAudioCall({
      userId: session.userId,
      advocateId: session.advocateId,
      since,
    });
  } catch (err) {
    console.error('audio call status check failed', err);
    return session;
  }

  try {
    if (ringing) {
      // 'ended' as well as 'answered': a call short enough to be over before we
      // first looked was still answered, so it is still owed.
      if (outcome.state === 'answered' || outcome.state === 'ended') {
        const active = await acceptConsultation(session.id, session.advocateId);
        if (outcome.state !== 'ended') return active;
        // Already over: end it too, so the minutes they didn't use are on the
        // record as leftover.
        lastChecked.delete(session.id);
        return (await endConsultation(session.id, session.userId)) || active;
      }
      // Rang out with nobody picking up counts the same as a decline: no charge.
      if (outcome.state === 'declined' || rangFor > RING_TIMEOUT_MS) {
        lastChecked.delete(session.id);
        return (await rejectConsultation(session.id, session.advocateId)) || session;
      }
      return session;
    }

    // Live session: the phone call is what it is made of, so when the call is
    // over the session is over — whichever side hung up. Whatever is left of
    // the booked time stays claimable, free, for the next 24 hours.
    if (outcome.state === 'ended' || outcome.state === 'declined') {
      lastChecked.delete(session.id);
      return (await endConsultation(session.id, session.userId)) || session;
    }
  } catch (err) {
    console.error('audio call settle failed', err);
  }
  return session;
}

/** GET /api/consultations/[id] — poll session status + messages. */
export async function GET(_request, { params }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

  const { id } = await params;
  let session = await getConsultation(id);
  if (!session) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  if (!isParticipant(session, s)) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  // This poll is what tracks the phone call: whether it was answered, and
  // whether it has since been hung up.
  if (session.type === 'audio' && ['pending', 'active'].includes(session.status)) {
    session = await settlePhoneCall(session);
  }

  return NextResponse.json({ session });
}

/**
 * PATCH /api/consultations/[id]  { action: 'accept'|'reject'|'cancel'|'end' }
 * Drives the session lifecycle. accept/reject are lawyer-only; cancel is
 * user-only; end is either participant.
 */
export async function PATCH(request, { params }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const action = String(body?.action || '');

  try {
    if (action === 'accept') {
      if (s.role !== 'advocate') return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
      const session = await acceptConsultation(id, s.id);
      return NextResponse.json({ ok: true, session });
    }
    if (action === 'reject') {
      if (s.role !== 'advocate') return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
      const session = await rejectConsultation(id, s.id);
      return NextResponse.json({ ok: true, session });
    }
    if (action === 'cancel') {
      if (s.role !== 'user') return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
      const session = await cancelConsultation(id, s.id);
      return NextResponse.json({ ok: true, session });
    }
    if (action === 'end') {
      const session = await endConsultation(id, s.id);
      return NextResponse.json({ ok: true, session });
    }
    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (err) {
    if (err.code === 'INSUFFICIENT') {
      return NextResponse.json({ error: 'insufficient', message: 'User has insufficient wallet balance.' }, { status: 402 });
    }
    if (err.code === 'NOT_FOUND') return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    if (err.code === 'BAD_STATE') return NextResponse.json({ error: 'This request was already handled.' }, { status: 409 });
    console.error('consultation PATCH error', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}

/**
 * DELETE /api/consultations/[id]
 * Clears the consultation from the caller's own list only — the other
 * participant's history and the money ledger are kept.
 */
export async function DELETE(_request, { params }) {
  const s = await getSession();
  if (!s || (s.role !== 'advocate' && s.role !== 'user')) {
    return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });
  }

  const { id } = await params;
  try {
    await hideConsultationFor(id, s.id, s.role);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err.code === 'NOT_FOUND') return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    if (err.code === 'BAD_STATE') {
      return NextResponse.json({ error: 'You can\'t remove a consultation that is still live.' }, { status: 409 });
    }
    console.error('consultation DELETE error', err);
    return NextResponse.json({ error: 'Could not remove it. Please try again.' }, { status: 500 });
  }
}
