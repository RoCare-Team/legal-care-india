import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { comparePassword, signToken, setAuthCookie } from '@/lib/auth';

/**
 * POST /api/auth/user/login
 * Verifies client (user) credentials and issues the session cookie (role: 'user').
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
    const user = await User.findOne({ email: email.trim().toLowerCase() });

    // Same message for "no such account" and "wrong password" (no enumeration).
    if (!user || !(await comparePassword(password, user.passwordHash))) {
      return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 });
    }

    const token = signToken({ id: String(user._id), role: 'user' });
    const res = NextResponse.json({
      ok: true,
      user: { id: String(user._id), name: user.name, email: user.email },
    });
    return setAuthCookie(res, token);
  } catch (err) {
    console.error('user login error', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
