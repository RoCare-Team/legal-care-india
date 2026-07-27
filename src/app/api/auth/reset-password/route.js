import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { hashOtp, hashPassword, RESET_OTP_MAX_ATTEMPTS } from '@/lib/auth';
import { accountModel, normalizeRole } from '@/lib/passwordReset';

/**
 * POST /api/auth/reset-password  { email, otp, password, role }
 *
 * Verifies the OTP (hash + not expired + within attempt limit) and sets a new
 * password. `role` must match the one the code was requested with, otherwise
 * the OTP simply will not be found — a code issued to a user account cannot be
 * spent against a lawyer account of the same email.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const email = String(body?.email || '').trim().toLowerCase();
  const otp = String(body?.otp || '').trim();
  const password = String(body?.password || '');
  const role = normalizeRole(body?.role);

  if (!email || !otp) {
    return NextResponse.json({ error: 'Enter the 6-digit code sent to you.' }, { status: 400 });
  }
  if (!/^\d{6}$/.test(otp)) {
    return NextResponse.json({ error: 'The code must be 6 digits.' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters.' },
      { status: 400 }
    );
  }

  try {
    await connectDB();

    const account = await accountModel(role).findOne({ email }).select(
      '+resetOtpHash +resetOtpExpires +resetOtpAttempts'
    );

    const hasOtp = account?.resetOtpHash && account?.resetOtpExpires;
    const expired = hasOtp && account.resetOtpExpires.getTime() < Date.now();

    if (!hasOtp || expired) {
      return NextResponse.json(
        { error: 'This code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    if (account.resetOtpAttempts >= RESET_OTP_MAX_ATTEMPTS) {
      // Too many wrong tries — invalidate the code entirely.
      account.resetOtpHash = null;
      account.resetOtpExpires = null;
      account.resetOtpAttempts = 0;
      await account.save();
      return NextResponse.json(
        { error: 'Too many incorrect attempts. Please request a new code.' },
        { status: 429 }
      );
    }

    if (account.resetOtpHash !== hashOtp(otp)) {
      account.resetOtpAttempts += 1;
      await account.save();
      const left = RESET_OTP_MAX_ATTEMPTS - account.resetOtpAttempts;
      return NextResponse.json(
        { error: `Incorrect code. ${left > 0 ? `${left} attempt(s) left.` : 'Please request a new code.'}` },
        { status: 400 }
      );
    }

    // Success — set the new password and clear the OTP.
    account.passwordHash = await hashPassword(password);
    account.resetOtpHash = null;
    account.resetOtpExpires = null;
    account.resetOtpAttempts = 0;
    await account.save();

    return NextResponse.json({ ok: true, message: 'Your password has been reset. You can now log in.' });
  } catch (err) {
    console.error('reset-password error', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
