import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { hashPassword, signToken, setAuthCookie } from '@/lib/auth';

/**
 * POST /api/auth/user/register
 * Creates a regular client account, logs them in (httpOnly cookie, role: 'user').
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { name, email, phone, password } = body || {};

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }
  if ((password || '').length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  try {
    await connectDB();
    const normalizedEmail = email.trim().toLowerCase();

    if (await User.findOne({ email: normalizedEmail })) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please log in.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: (phone || '').trim(),
      passwordHash,
    });

    const token = signToken({ id: String(user._id), role: 'user' });
    const res = NextResponse.json(
      { ok: true, user: { id: String(user._id), name: user.name, email: user.email } },
      { status: 201 }
    );
    return setAuthCookie(res, token);
  } catch (err) {
    if (err?.code === 11000) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please log in.' },
        { status: 409 }
      );
    }
    console.error('user register error', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
