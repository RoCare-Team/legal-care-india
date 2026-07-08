import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';
import { createOtp } from '@/lib/auth';
import { sendEmail, passwordResetEmail } from '@/lib/mailer';
import { sendOtpSms, normalizeIndianMobile } from '@/lib/sms';

/**
 * POST /api/auth/forgot-password  { email }
 * If an account exists, generates a 6-digit OTP, stores its hash + expiry, and
 * sends it to the advocate's registered email AND phone. Always returns the same
 * success response so the endpoint can't reveal which emails are registered.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const email = String(body?.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  try {
    await connectDB();
    const advocate = await Advocate.findOne({ email });

    if (advocate) {
      const { otp, otpHash, expires } = createOtp();
      advocate.resetOtpHash = otpHash;
      advocate.resetOtpExpires = expires;
      advocate.resetOtpAttempts = 0;
      await advocate.save();

      const phone = advocate.phone || advocate.contact?.phone;

      // Send to both channels. Failures are logged but never block the response.
      await Promise.allSettled([
        sendEmail({ to: email, ...passwordResetEmail({ name: advocate.name, otp }) }),
        phone ? sendOtpSms({ phone, otp }) : Promise.resolve(),
      ]);

      // A masked phone hint helps the user without revealing the full number.
      const mobile = normalizeIndianMobile(phone);
      const phoneHint = mobile.length === 10 ? `••••••${mobile.slice(-4)}` : null;

      return NextResponse.json({
        ok: true,
        phoneHint,
        message: 'We sent a 6-digit code to your registered email and phone.',
      });
    }

    // No account — same shape, generic wording (no enumeration).
    return NextResponse.json({
      ok: true,
      phoneHint: null,
      message: 'If an account exists for that email, a 6-digit code is on its way.',
    });
  } catch (err) {
    console.error('forgot-password error', err);
    return NextResponse.json(
      { ok: true, phoneHint: null, message: 'If an account exists for that email, a code is on its way.' }
    );
  }
}
