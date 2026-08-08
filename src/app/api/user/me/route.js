import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { getSessionUserId } from '@/lib/auth';
import { setUserAnonymous } from '@/lib/users';

/**
 * PATCH /api/user/me — update the logged-in user's account preferences.
 *
 * Two fields: the anonymity switch (hide my name from lawyers), and the display
 * name. Name lives here because mobile-OTP login creates an account without
 * one — there is no sign-up form left to collect it, so it is filled in
 * afterwards, either right after the first login or from the account page.
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

  const hasAnonymous = typeof body?.anonymous === 'boolean';
  const hasName = typeof body?.name === 'string';

  if (!hasAnonymous && !hasName) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  }

  try {
    let updated = null;

    if (hasName) {
      const name = body.name.trim().replace(/\s+/g, ' ');
      if (name.length < 2 || name.length > 60) {
        return NextResponse.json(
          { error: 'Enter your name (2–60 characters).' },
          { status: 400 }
        );
      }
      await connectDB();
      updated = await User.findByIdAndUpdate(id, { name }, { new: true });
      if (!updated) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }

    if (hasAnonymous) {
      updated = await setUserAnonymous(id, body.anonymous);
      if (!updated) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      name: updated.name,
      anonymous: updated.anonymous,
    });
  } catch (err) {
    console.error('user preference update error', err);
    return NextResponse.json({ error: 'Could not update your settings.' }, { status: 500 });
  }
}
