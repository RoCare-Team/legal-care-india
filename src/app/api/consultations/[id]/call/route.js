import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  startCall,
  answerCall,
  hangUpCall,
  pushCallSignal,
  getCallState,
} from '@/lib/consultations';

/**
 * WebRTC signalling for the video call inside a live consultation.
 *
 * This endpoint carries only the handshake — SDP descriptions and ICE
 * candidates. Once the two browsers connect, the audio and video flow directly
 * between them and never touch this server.
 *
 * Direction mirrors the booking: the client rings, the lawyer accepts or
 * rejects. Both sides may hang up once connected.
 */

// Signalling is live by definition — never cache it.
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };

/** Map a coded lib error onto an HTTP response. */
function errorResponse(err, fallback) {
  if (err.code === 'NOT_FOUND') {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }
  if (err.code === 'FORBIDDEN') {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }
  if (err.code === 'BAD_STATE') {
    return NextResponse.json({ error: err.message }, { status: 409 });
  }
  console.error('call signalling error', err);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

/** Only the two participants of the consultation may signal on it. */
async function participantSession() {
  const s = await getSession();
  if (!s || (s.role !== 'user' && s.role !== 'advocate')) return null;
  return s;
}

/**
 * GET /api/consultations/[id]/call?since=<n>
 * Polled roughly once a second while a call is up. Returns the other side's
 * description and any ICE candidates past `since`.
 */
export async function GET(request, { params }) {
  const s = await participantSession();
  if (!s) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });

  const { id } = await params;
  const since = new URL(request.url).searchParams.get('since');

  try {
    const state = await getCallState(id, s.id, s.role, since);
    return NextResponse.json(state, { headers: NO_STORE });
  } catch (err) {
    return errorResponse(err, 'Could not read the call state.');
  }
}

/**
 * POST /api/consultations/[id]/call
 *   { action: 'start' }                      — client rings the lawyer
 *   { action: 'accept' | 'reject' }          — lawyer answers the ring
 *   { action: 'end', reason? }               — either side hangs up
 *   { action: 'signal', callId, offer? , answer?, candidate? }
 */
export async function POST(request, { params }) {
  const s = await participantSession();
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
    if (action === 'start') {
      // Only the client may ring — same direction as the booking itself.
      if (s.role !== 'user') {
        return NextResponse.json(
          { error: 'Only the client can start a video call.' },
          { status: 403 }
        );
      }
      const call = await startCall(id, s.id);
      return NextResponse.json({ ok: true, call }, { headers: NO_STORE });
    }

    if (action === 'accept' || action === 'reject') {
      if (s.role !== 'advocate') {
        return NextResponse.json(
          { error: 'Only the lawyer can answer the call.' },
          { status: 403 }
        );
      }
      const call = await answerCall(id, s.id, action === 'accept');
      return NextResponse.json({ ok: true, call }, { headers: NO_STORE });
    }

    if (action === 'end') {
      const reason = body?.reason === 'failed' ? 'failed' : 'hangup';
      const call = await hangUpCall(id, s.id, s.role, reason);
      return NextResponse.json({ ok: true, call }, { headers: NO_STORE });
    }

    if (action === 'signal') {
      const call = await pushCallSignal(id, s.id, s.role, {
        callId: body?.callId ? String(body.callId) : '',
        offer: body?.offer ? String(body.offer) : '',
        answer: body?.answer ? String(body.answer) : '',
        candidate: body?.candidate ? String(body.candidate) : '',
      });
      return NextResponse.json({ ok: true, call }, { headers: NO_STORE });
    }

    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (err) {
    return errorResponse(err, 'Could not complete the call action.');
  }
}
