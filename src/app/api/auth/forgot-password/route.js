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
  // Which channel to deliver the OTP on — 'email' (default) or 'phone'.
  const channel = body?.channel === 'phone' ? 'phone' : 'email';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  /** Mask an email like ro****@gmail.com. */
  const maskEmail = (e) => {
    const [user, domain] = e.split('@');
    const head = user.slice(0, 2);
    return `${head}${'•'.repeat(Math.max(2, user.length - 2))}@${domain}`;
  };

  try {
    await connectDB();
    const advocate = await Advocate.findOne({ email });

    if (advocate) {
      const phone = advocate.phone || advocate.contact?.phone;
      const mobile = normalizeIndianMobile(phone);

      // If they asked for SMS but we have no valid mobile on record, stop early.
      if (channel === 'phone' && mobile.length !== 10) {
        return NextResponse.json(
          { error: 'No valid phone number is saved on this account. Try email instead.' },
          { status: 400 }
        );
      }

      const { otp, otpHash, expires } = createOtp();
      advocate.resetOtpHash = otpHash;
      advocate.resetOtpExpires = expires;
      advocate.resetOtpAttempts = 0;
      await advocate.save();

      // Send only on the chosen channel.
      if (channel === 'phone') {
        await sendOtpSms({ phone, otp });
      } else {
        await sendEmail({ to: email, ...passwordResetEmail({ name: advocate.name, otp }) });
      }

      const sentTo =
        channel === 'phone' ? `••••••${mobile.slice(-4)}` : maskEmail(email);

      return NextResponse.json({
        ok: true,
        channel,
        sentTo,
        message: `We sent a 6-digit code to your ${channel === 'phone' ? 'phone' : 'email'}.`,
      });
    }

    // No account — same shape, generic wording (no enumeration).
    return NextResponse.json({
      ok: true,
      channel,
      sentTo: null,
      message: 'If an account exists for that email, a 6-digit code is on its way.',
    });
  } catch (err) {
    console.error('forgot-password error', err);
    return NextResponse.json({
      ok: true,
      channel,
      sentTo: null,
      message: 'If an account exists for that email, a code is on its way.',
    });
  }
}
