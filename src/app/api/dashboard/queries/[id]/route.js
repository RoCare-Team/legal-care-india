import { NextResponse } from 'next/server';
import { getSessionAdvocateId } from '@/lib/auth';
import { getAdvocateById } from '@/lib/advocates';
import { claimQuery, releaseQuery, resolveQuery } from '@/lib/queries';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/dashboard/queries/<id>
 *   { action: 'claim' }             — take it; it leaves everyone else's pool
 *   { action: 'release' }           — put it back for another lawyer
 *   { action: 'resolve', note? }    — done; it never returns to the pool
 */
export async function PATCH(request, { params }) {
  const advocateId = await getSessionAdvocateId();
  if (!advocateId) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const { id } = await params;
  let body = {};
  try {
    body = await request.json();
  } catch {
    /* an unknown action is reported below */
  }

  try {
    if (body?.action === 'claim') {
      const advocate = await getAdvocateById(advocateId);
      if (!advocate) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
      const query = await claimQuery(id, { id: advocateId, name: advocate.name });
      return NextResponse.json({ ok: true, query });
    }
    if (body?.action === 'release') {
      const query = await releaseQuery(id, advocateId);
      return NextResponse.json({ ok: true, query });
    }
    if (body?.action === 'resolve') {
      const query = await resolveQuery(id, advocateId, body.note);
      return NextResponse.json({ ok: true, query });
    }
    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (err) {
    if (err?.status) {
      return NextResponse.json({ error: err.message, code: err.code || undefined }, { status: err.status });
    }
    console.error('query action', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
