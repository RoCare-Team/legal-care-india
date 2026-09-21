import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getAdminSession } from '@/lib/admin';
import { saveCallRecording, readCallRecording } from '@/lib/callRecordings';

export const dynamic = 'force-dynamic';

/**
 * The recording for one call attempt inside a consultation.
 *
 * POST (multipart, participant-only) — uploaded automatically by the
 * browser/app once a call ends (see useVideoCall.js). Whichever side finishes
 * recording first "wins" for that callId; a second upload just overwrites.
 *
 * GET (participant or admin) — streams the file back for playback/download.
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

  const file = form.get('file');
  const callId = String(form.get('callId') || '');
  if (!file || typeof file === 'string' || !callId) {
    return NextResponse.json({ error: 'Missing recording or call id.' }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const saved = await saveCallRecording({
      consultationId: id,
      participantId: s.id,
      role: s.role,
      callId,
      buffer,
      mimeType: file.type || 'audio/webm',
    });
    return NextResponse.json({ ok: true, ...saved });
  } catch (err) {
    if (err.status) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error('recording upload failed', err);
    return NextResponse.json({ error: 'Could not save the recording.' }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  const { id } = await params;
  const callId = new URL(request.url).searchParams.get('callId') || '';

  const admin = await getAdminSession();
  const s = admin ? null : await getSession();
  if (!admin && (!s || (s.role !== 'user' && s.role !== 'advocate'))) {
    return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });
  }

  try {
    const { buffer, mimeType, size } = await readCallRecording(
      id,
      callId,
      admin ? { role: 'admin' } : { role: s.role, id: s.id }
    );
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': String(size),
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    if (err.status) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error('recording read failed', err);
    return NextResponse.json({ error: 'Could not read the recording.' }, { status: 500 });
  }
}
