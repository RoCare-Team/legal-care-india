import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

/**
 * GET /api/webrtc/ice — the ICE servers a browser needs to negotiate a call.
 *
 * STUN alone lets most home/office networks find each other directly. It is
 * not enough on Indian mobile data, where carrier-grade NAT hides both ends:
 * those calls need a TURN relay. Set TURN_URL / TURN_USERNAME / TURN_CREDENTIAL
 * in .env.local and it is handed out here automatically — nothing else changes.
 *
 * Sign-in gated so TURN credentials (which cost bandwidth) aren't public.
 */

export const dynamic = 'force-dynamic';

/** Public STUN fallback — used when STUN_URLS isn't configured. */
const DEFAULT_STUN = [
  'stun:stun.l.google.com:19302',
  'stun:stun1.l.google.com:19302',
];

let turnWarned = false;

/** Log the missing-relay warning once per server start. */
function warnNoTurn() {
  if (turnWarned) return;
  turnWarned = true;
  console.warn(
    '[webrtc] No TURN_URL configured — video and audio calls will fail between ' +
      'networks that STUN cannot traverse (most mobile data in India). Set ' +
      'TURN_URL / TURN_USERNAME / TURN_CREDENTIAL to fix.'
  );
}

/** Split a comma-separated env list into a clean array. */
function list(value, fallback = []) {
  const parts = String(value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
  return parts.length ? parts : fallback;
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });
  }

  const iceServers = [{ urls: list(process.env.STUN_URLS, DEFAULT_STUN) }];

  const turnUrls = list(process.env.TURN_URL);
  if (turnUrls.length) {
    iceServers.push({
      urls: turnUrls,
      username: process.env.TURN_USERNAME || '',
      credential: process.env.TURN_CREDENTIAL || '',
    });
  } else {
    // Said once per cold start, not per call. Without a relay every call
    // between two carrier-grade-NAT networks — which is most Indian mobile
    // data — rings normally and then never connects, and the only clue in the
    // logs would be its absence.
    warnNoTurn();
  }

  return NextResponse.json(
    { iceServers, hasTurn: turnUrls.length > 0 },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
