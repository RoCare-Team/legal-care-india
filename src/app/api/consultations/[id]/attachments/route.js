import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { sendChatAttachment } from '@/lib/chatAttachments';

export const dynamic = 'force-dynamic';

/**
 * POST /api/consultations/[id]/attachments   multipart: file, caption?
 * A participant sends a document or photo into an active session's chat.
 */
export async function POST(request, { params }) {
  const s = await getSession();
  if (!s || (s.role !== 'user' && s.role !== 'advocate')) {
    return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });
  }

  const { id } = await params;
  let form;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid upload.' }, { status: 400 });
  }

  try {
    const session = await sendChatAttachment({
      sessionId: id,
      participantId: s.id,
      role: s.role,
      file: form.get('file'),
      caption: String(form.get('caption') || ''),
    });
    return NextResponse.json({ ok: true, session });
  } catch (err) {
    if (err.code === 'BAD_FILE') return NextResponse.json({ error: err.message }, { status: 400 });
    if (err.code === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    if (err.code === 'NOT_FOUND') return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    if (err.code === 'BAD_STATE') return NextResponse.json({ error: 'This session is not active.' }, { status: 409 });
    console.error('chat attachment upload error', err);
    return NextResponse.json({ error: 'Could not send the file.' }, { status: 500 });
  }
}
