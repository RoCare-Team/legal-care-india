import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import LoginOtp from '@/models/LoginOtp';
import {
  normalizePhone,
  requestOtp,
  LOGIN_OTP_RESEND_SECONDS,
  LOGIN_OTP_MAX_PER_HOUR,
  LOGIN_OTP_WINDOW_MS,
} from '@/lib/loginOtp';

/** How long a throttle row outlives its last use. */
const ROW_TTL_MS = 2 * LOGIN_OTP_WINDOW_MS;

/**
 * POST /api/auth/user/otp/send  { phone }
 *
 * Has the SMS gateway text a login code to a mobile number.
 *
 * Unlike the password-reset endpoint this does not hide whether an account
 * exists: with mobile login, entering a number that has never been used is how
 * you sign up, so there is nothing to enumerate.
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
    const now = Date.now();
    const record = await LoginOtp.findOne({ phone });

    if (record) {
      // Resend cooldown — stops a held-down button turning into an SMS bill.
      const since = now - new Date(record.lastSentAt).getTime();
      const wait = Math.ceil((LOGIN_OTP_RESEND_SECONDS * 1000 - since) / 1000);
      if (wait > 0) {
        return NextResponse.json(
          {
            error: 'too-soon',
            retryAfter: wait,
            message: `Please wait ${wait}s before asking for another code.`,
          },
          { status: 429 }
        );
      }

      // Hourly ceiling per number, so one phone cannot be used to send SMS at
      // someone else's expense all day.
      const freshWindow = now - new Date(record.windowStartedAt).getTime() > LOGIN_OTP_WINDOW_MS;
      if (!freshWindow && record.sendCount >= LOGIN_OTP_MAX_PER_HOUR) {
        return NextResponse.json(
          {
            error: 'rate-limited',
            message: 'Too many codes requested for this number. Please try again in an hour.',
          },
          { status: 429 }
        );
      }
    }

    const result = await requestOtp(phone);
    if (!result.ok) {
      console.error('[otp/send] gateway refused', result.message);
      return NextResponse.json(
        {
          error: 'send-failed',
          message: result.message || 'We could not send the code right now. Please try again.',
        },
        { status: 502 }
      );
    }

    // Only count a code that actually went out, so a gateway outage does not
    // burn the visitor's hourly allowance.
    const freshWindow =
      !record || now - new Date(record.windowStartedAt).getTime() > LOGIN_OTP_WINDOW_MS;
    await LoginOtp.updateOne(
      { phone },
      {
        $set: {
          lastSentAt: new Date(now),
          // A new code resets the guess counter — the old code is gone.
          attempts: 0,
          expiresAt: new Date(now + ROW_TTL_MS),
          ...(freshWindow ? { windowStartedAt: new Date(now), sendCount: 1 } : {}),
        },
        ...(freshWindow ? {} : { $inc: { sendCount: 1 } }),
      },
      { upsert: true }
    );

    return NextResponse.json({
      ok: true,
      sentTo: `••••••${phone.slice(-4)}`,
      resendIn: LOGIN_OTP_RESEND_SECONDS,
    });
  } catch (err) {
    console.error('otp/send error', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
