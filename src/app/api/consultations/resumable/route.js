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

  const advocateId = new URL(request.url).searchParams.get('advocateId');
  if (!advocateId) {
    return NextResponse.json({ resumable: null });
  }

  try {
    const resumable = await getResumableSession(session.id, advocateId);
    return NextResponse.json({ resumable }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('resumable check error', err);
    return NextResponse.json({ resumable: null });
  }
}
