import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';
import LoginOtp from '@/models/LoginOtp';
import { signToken, setAuthCookie, clearAuthCookie } from '@/lib/auth';
import { normalizePhone, checkThrottledOtp, OTP_LENGTH } from '@/lib/loginOtp';
import { signSignupToken, setSignupCookie } from '@/lib/advocateOtp';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/advocate/otp/verify  { phone, otp }
 *
 * Checks the code and then does one of two things, decided entirely by whether
 * the number already belongs to a lawyer:
 *
 *   already registered → signed in, session cookie set, done.
 *   new number         → no account is created here. A short-lived proof that
 *                        the number answered is set instead, and the browser is
 *                        told to collect a name, email and city.
 *
 * Nothing is written for a new number on purpose. An account made from a phone
 * number alone would have no name to show and no email to reach, and there is
 * no way to tell one abandoned halfway through from a real lawyer who has not
 * finished — the directory would silently fill with blanks.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const phone = normalizePhone(body?.phone);
  const otp = String(body?.otp || '').trim();

  if (!phone) {
    return NextResponse.json({ error: 'Enter a valid 10-digit mobile number.' }, { status: 400 });
  }
  if (!new RegExp(`^\\d{${OTP_LENGTH}}$`).test(otp)) {
    return NextResponse.json({ error: `Enter the ${OTP_LENGTH}-digit code.` }, { status: 400 });
  }

  try {
    await connectDB();

    const check = await checkThrottledOtp(LoginOtp, phone, otp);
    if (!check.ok) return NextResponse.json(check.body, { status: check.status });

    const advocate = await Advocate.findOne({ phoneNormalized: phone })
      .select('_id name status')
      .lean();

    if (advocate) {
      const token = signToken({ id: String(advocate._id), role: 'advocate' });
      const res = NextResponse.json({
        ok: true,
        registered: true,
        name: advocate.name || '',
        // Where to go next. A lawyer still under review sees the same
        // dashboard as anyone else — it is where the review is explained.
        redirect: '/dashboard',
      });
      return setAuthCookie(res, token);
    }

    // New number. The proof travels in an httpOnly cookie rather than back
    // through the page, so the browser cannot hand the signup route a number
    // of its choosing.
    const res = NextResponse.json({
      ok: true,
      registered: false,
      phone,
    });

    // Any session still in this browser belongs to a different number — the
    // one just proved has no account. Leaving it would let a stale token speak
    // for a lawyer who is in the middle of registering as somebody else.
    clearAuthCookie(res);
    return setSignupCookie(res, signSignupToken(phone));
  } catch (err) {
    console.error('advocate otp/verify error', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
