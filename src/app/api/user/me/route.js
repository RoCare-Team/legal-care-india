import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { setUserAnonymous } from '@/lib/users';

/**
 * PATCH /api/user/me — update the logged-in user's account preferences.
 * Currently just the anonymity switch (hide my name from lawyers).
 */
export async function PATCH(request) {
  const id = await getSessionUserId();
  if (!id) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (typeof body?.anonymous !== 'boolean') {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  }

  try {
    const user = await setUserAnonymous(id, body.anonymous);
    if (!user) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    return NextResponse.json({ ok: true, anonymous: user.anonymous });
  } catch (err) {
    console.error('user preference update error', err);
    return NextResponse.json({ error: 'Could not update your settings.' }, { status: 500 });
  }
}
