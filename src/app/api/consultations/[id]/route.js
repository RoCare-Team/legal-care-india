import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
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

/** GET /api/consultations/[id] — poll session status + messages. */
export async function GET(_request, { params }) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

  const { id } = await params;
  const session = await getConsultation(id);
  if (!session) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  if (!isParticipant(session, s)) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  return NextResponse.json({ session });
}

/**
 * PATCH /api/consultations/[id]  { action: 'accept'|'reject'|'cancel'|'end' }
 * Drives the session lifecycle. accept/reject are advocate-only; cancel is
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
