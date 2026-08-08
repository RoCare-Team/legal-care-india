import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import LoginOtp from '@/models/LoginOtp';
import { signToken, setAuthCookie } from '@/lib/auth';
import {
  normalizePhone,
  checkOtp,
  OTP_LENGTH,
  LOGIN_OTP_MAX_ATTEMPTS,
} from '@/lib/loginOtp';

/**
 * POST /api/auth/user/otp/verify  { phone, otp }
 *
 * Checks the code with the SMS gateway and signs the visitor in. If no account
 * exists for that number one is created here — a first login *is* the sign-up,
 * which is why there is no separate registration step any more.
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

    // The gateway's verify endpoint takes no token and does not rate-limit, so
    // a 4-digit code would otherwise be brute-forceable in a few thousand
    // requests. The guess counter has to live on our side.
    const throttle = await LoginOtp.findOne({ phone });
    if (throttle && throttle.attempts >= LOGIN_OTP_MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: 'locked', message: 'Too many wrong attempts. Please request a new code.' },
        { status: 429 }
      );
    }

    const result = await checkOtp(phone, otp);

    if (!result.ok) {
      if (throttle) {
        throttle.attempts += 1;
        await throttle.save();
      }
      const left = throttle
        ? Math.max(0, LOGIN_OTP_MAX_ATTEMPTS - throttle.attempts)
        : LOGIN_OTP_MAX_ATTEMPTS;
      return NextResponse.json(
        {
          error: 'invalid',
          message: left > 0
            ? `Incorrect code. ${left} ${left === 1 ? 'attempt' : 'attempts'} left.`
            : 'Incorrect code. Please request a new one.',
        },
        { status: 400 }
      );
    }

    // Verified. Clear the throttle so the next login starts clean.
    await LoginOtp.deleteOne({ phone });

    let user = await User.findOne({ phone });
    let created = false;

    if (!user) {
      try {
        user = await User.create({ phone, name: '' });
        created = true;
      } catch (err) {
        // Two requests for the same number can reach this line together; the
        // unique index lets exactly one insert win. The loser is not an error
        // — the account it wanted now exists, so fetch it and carry on.
        if (err?.code === 11000) {
          user = await User.findOne({ phone });
        }
        if (!user) throw err;
      }
    }

    const token = signToken({ id: String(user._id), role: 'user' });
    const res = NextResponse.json({
      ok: true,
      created,
      // The form uses this to decide whether to ask for a name: a brand-new
      // account has none, and neither does an older one that never set it.
      needsName: !String(user.name || '').trim(),
      user: {
        id: String(user._id),
        name: user.name || '',
        phone: user.phone,
      },
    });
    return setAuthCookie(res, token);
  } catch (err) {
    console.error('otp/verify error', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
