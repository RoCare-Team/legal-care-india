import { NextResponse } from 'next/server';
import { getSessionAdvocateId } from '@/lib/auth';
import { getAdvocateById } from '@/lib/advocates';

/**
 * GET /api/auth/me — returns the logged-in advocate (or null).
 */
export async function GET() {
  const id = await getSessionAdvocateId();
  if (!id) return NextResponse.json({ advocate: null });

  const advocate = await getAdvocateById(id);
  return NextResponse.json({ advocate: advocate || null });
}
