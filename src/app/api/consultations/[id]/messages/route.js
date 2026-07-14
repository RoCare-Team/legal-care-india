import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { addMessage } from '@/lib/consultations';

/**
 * POST /api/consultations/[id]/messages  { text }
 * A participant posts a chat message into an active session.
 */
export async function POST(request, { params }) {
  const s = await getSession();
  if (!s || (s.role !== 'user' && s.role !== 'advocate')) {
    return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });
  }

  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const text = String(body?.text || '').trim();
  if (!text) return NextResponse.json({ error: 'Message is empty.' }, { status: 400 });
  if (text.length > 2000) return NextResponse.json({ error: 'Message too long.' }, { status: 400 });

  try {
    const session = await addMessage(id, s.id, s.role, text);
    return NextResponse.json({ ok: true, session });
  } catch (err) {
    if (err.code === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    if (err.code === 'NOT_FOUND') return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    if (err.code === 'BAD_STATE') return NextResponse.json({ error: 'This session is not active.' }, { status: 409 });
    console.error('consultation message error', err);
    return NextResponse.json({ error: 'Could not send message.' }, { status: 500 });
  }
}
