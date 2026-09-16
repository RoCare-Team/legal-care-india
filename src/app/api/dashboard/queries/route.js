import { NextResponse } from 'next/server';
import { getSessionAdvocateId } from '@/lib/auth';
import { getQueriesForAdvocate } from '@/lib/queries';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard/queries?category=&city=
 *
 * The lawyer's view of the pool: open questions without contact details, the
 * ones they have claimed with them, and the ones they have finished.
 */
export async function GET(request) {
  const id = await getSessionAdvocateId();
  if (!id) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  try {
    const data = await getQueriesForAdvocate(id, {
      category: searchParams.get('category') || '',
      city: searchParams.get('city') || '',
    });
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('GET dashboard queries', err);
    return NextResponse.json({ error: 'Could not load client queries.' }, { status: 500 });
  }
}
