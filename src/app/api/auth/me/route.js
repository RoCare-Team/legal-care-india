import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getAdvocateById } from '@/lib/advocates';
import { getUserById } from '@/lib/users';

/**
 * GET /api/auth/me — returns the current session.
 * Shape: { role: 'advocate'|'user'|null, advocate, user }
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ role: null, advocate: null, user: null });
  }

  if (session.role === 'user') {
    const user = await getUserById(session.id);
    return NextResponse.json({ role: user ? 'user' : null, advocate: null, user });
  }

  const advocate = await getAdvocateById(session.id);
  return NextResponse.json({ role: advocate ? 'advocate' : null, advocate, user: null });
}
