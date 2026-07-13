import { NextResponse } from 'next/server';
import { signToken } from '@/lib/auth';
import { verifyAdminCredentials, ADMIN_COOKIE } from '@/lib/admin';

/**
 * POST /api/admin/login  { email, password }
 * Verifies the admin credentials from the environment and, on success, sets a
 * signed httpOnly admin cookie.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { email, password } = body || {};
  if (!verifyAdminCredentials(email, password)) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  const token = signToken({ role: 'admin', email: String(email).trim().toLowerCase() });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}
