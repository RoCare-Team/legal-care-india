import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

const CONTACT_TYPES = ['call', 'whatsapp', 'email'];

/**
 * POST /api/activity  { advocateId, type }
 * Logs a user's Call / WhatsApp / Email tap on a lawyer profile so it shows
 * in their account history. Bookings are logged server-side by /api/enquiries,
 * so only contact taps are accepted here.
 */
export async function POST(request) {
  const userId = await getSessionUserId();
  // Only signed-in users have a history; silently ignore otherwise.
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const advocateId = String(body?.advocateId || '').trim();
  const type = String(body?.type || '').trim();

  if (!advocateId || !CONTACT_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid activity.' }, { status: 400 });
  }

  await logActivity({ userId, advocateId, type });
  return NextResponse.json({ ok: true });
}
