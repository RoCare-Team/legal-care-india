import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import LoginOtp from '@/models/LoginOtp';
import { normalizePhone, sendThrottledOtp } from '@/lib/loginOtp';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/advocate/otp/send  { phone }
 *
 * Texts a code to a lawyer's mobile number — the first and only step of both
 * signing in and signing up, since the number is what decides which of the two
 * is happening.
 *
 * Like the client version, this does not hide whether an account exists.
 * Entering a number that has never been used is how a lawyer registers, so
 * there is no membership to enumerate — and the answer to "does this number
 * have an account" is given at the *verify* step anyway, once the person has
 * proved the number is theirs.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const phone = normalizePhone(body?.phone);
  if (!phone) {
    return NextResponse.json(
      { error: 'Enter a valid 10-digit Indian mobile number.' },
      { status: 400 }
    );
  }

  try {
    await connectDB();
    const result = await sendThrottledOtp(LoginOtp, phone);
    return NextResponse.json(result.body, { status: result.ok ? 200 : result.status });
  } catch (err) {
    console.error('advocate otp/send error', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
