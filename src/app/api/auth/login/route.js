import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';
import { comparePassword, signToken, setAuthCookie } from '@/lib/auth';

/**
 * POST /api/auth/login
 * Verifies lawyer credentials and issues the session cookie.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { email, password } = body || {};
  if (!email || !password) {
    return NextResponse.json({ error: 'Enter your email and password.' }, { status: 400 });
  }

  try {
    await connectDB();
    const advocate = await Advocate.findOne({ email: email.trim().toLowerCase() });

    // Same message for "no such user" and "wrong password" (no account enumeration).
    if (!advocate || !(await comparePassword(password, advocate.passwordHash))) {
      return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 });
    }

    const token = signToken({ id: String(advocate._id), role: 'advocate' });
    const res = NextResponse.json({
      ok: true,
      advocate: { id: String(advocate._id), slug: advocate.slug, name: advocate.name },
    });
    return setAuthCookie(res, token);
  } catch (err) {
    console.error('login error', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
