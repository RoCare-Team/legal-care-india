import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getResumableSession } from '@/lib/consultations';

/**
 * GET /api/consultations/resumable?advocateId=xyz
 *
 * Does the signed-in user have leftover time with this lawyer that can be
 * reconnected for free right now? Returns `{ resumable: {...} | null }`. The
 * profile's Book modal calls this to decide whether to offer a free resume.
 */
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const session = await getSession();
  if (!session || session.role !== 'user') {
    return NextResponse.json({ resumable: null });
  }

  const params = new URL(request.url).searchParams;
  const advocateId = params.get('advocateId');
  if (!advocateId) {
    return NextResponse.json({ resumable: null });
  }
  // Each channel only sees its own leftover — phone minutes must not come back
  // as a free chat, or a video leftover as a phone call. Anything else is a
  // chat, which is also what the pre-`type` rows were.
  const asked = params.get('type');
  const type = ['audio', 'video'].includes(asked) ? asked : 'chat';

  try {
    const resumable = await getResumableSession(session.id, advocateId, type);
    return NextResponse.json({ resumable }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('resumable check error', err);
    return NextResponse.json({ resumable: null });
  }
}
