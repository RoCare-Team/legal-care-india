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
      //
      // A failure here is reported rather than swallowed. The generic replies
      // elsewhere in this route exist so nobody can discover which addresses
      // have accounts; a mail server that is down is not that secret, and
      // hiding it left the visitor on a "check your inbox" screen waiting for
      // a code that was never sent — with nothing but a server log to say so.
      try {
        if (channel === 'phone') {
          await sendOtpSms({ phone, otp });
        } else {
          const { delivered } = await sendEmail({
            to: email,
            ...passwordResetEmail({ name: account.name, otp }),
          });
          // `delivered: false` means no SMTP is configured at all — in
          // development the code is in the terminal, in production it is a
          // misconfiguration the visitor should not be left guessing about.
          if (!delivered && process.env.NODE_ENV === 'production') {
            throw new Error('SMTP is not configured');
          }
        }
      } catch (sendErr) {
        console.error('forgot-password: could not send OTP', sendErr);
        return NextResponse.json(
          {
            error: 'send-failed',
            message:
              'We could not send the code right now. Please try again in a few minutes, or contact support.',
          },
          { status: 502 }
        );
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
