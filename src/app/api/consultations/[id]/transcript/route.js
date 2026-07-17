import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getTranscriptFor } from '@/lib/consultations';

/**
 * GET /api/consultations/[id]/transcript — the full saved conversation between
 * the two parties, read-only and free. Only a participant may read it.
 */
export async function GET(_request, { params }) {
  const s = await getSession();
  if (!s || (s.role !== 'user' && s.role !== 'advocate')) {
    return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });
  }

  const { id } = await params;
  try {
    const { messages, otherName } = await getTranscriptFor(id, s.id, s.role);
    return NextResponse.json({ messages, otherName });
  } catch (err) {
    if (err.code === 'NOT_FOUND') return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    if (err.code === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    console.error('transcript error', err);
    return NextResponse.json({ error: 'Could not load the conversation.' }, { status: 500 });
  }
}
