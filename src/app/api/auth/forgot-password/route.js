import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { createOtp } from '@/lib/auth';
import { accountModel, normalizeRole } from '@/lib/passwordReset';
import { sendEmail, passwordResetEmail } from '@/lib/mailer';
import { sendOtpSms, normalizeIndianMobile } from '@/lib/sms';

/**
 * POST /api/auth/forgot-password  { email, channel, role }
 *
 * If an account of that role exists, generates a 6-digit OTP, stores its hash +
 * expiry, and sends it on the chosen channel. Always returns the same success
 * response so the endpoint can't reveal which emails are registered.
 *
 * `role` decides which collection is searched — 'user' or 'advocate'. The same
 * email can exist as both, so this must never be inferred.
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
  // Which account type is being reset. Defaults to the lawyer flow.
  const role = normalizeRole(body?.role);

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
    const account = await accountModel(role).findOne({ email });

    if (account) {
      const phone = account.phone || account.contact?.phone;
      const mobile = normalizeIndianMobile(phone);

      // If they asked for SMS but we have no valid mobile on record, stop early.
      if (channel === 'phone' && mobile.length !== 10) {
        return NextResponse.json(
          { error: 'No valid phone number is saved on this account. Try email instead.' },
          { status: 400 }
        );
      }

      const { otp, otpHash, expires } = createOtp();
      account.resetOtpHash = otpHash;
      account.resetOtpExpires = expires;
      account.resetOtpAttempts = 0;
      await account.save();

      // Send only on the chosen channel.
      if (channel === 'phone') {
        await sendOtpSms({ phone, otp });
      } else {
        await sendEmail({ to: email, ...passwordResetEmail({ name: account.name, otp }) });
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
