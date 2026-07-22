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
  }

  return NextResponse.json(
    { iceServers, hasTurn: turnUrls.length > 0 },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
