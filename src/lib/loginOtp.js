import { normalizeIndianMobile } from '@/lib/sms';

/**
 * Mobile-login OTP, delivered and checked by the shared SMS gateway.
 *
 * The gateway owns the code: it generates it, sends the SMS, and is the thing
 * that says whether a submitted code is right. We never see or store it. What
 * this file adds is the part the gateway does not do — throttling, and turning
 * its replies into something the routes can act on.
 *
 * Configure in .env.local:
 *   OTP_SEND_URL, OTP_VERIFY_URL, OTP_TOKEN, OTP_SOURCE
 */

/** How many digits the gateway's code has. */
export const OTP_LENGTH = 4;
/** Seconds a visitor must wait before asking for another code. */
export const LOGIN_OTP_RESEND_SECONDS = 30;
/** Codes one number may request per hour, so nobody can run up an SMS bill. */
export const LOGIN_OTP_MAX_PER_HOUR = 5;
export const LOGIN_OTP_WINDOW_MS = 60 * 60 * 1000;
/** Wrong guesses allowed before the number is made to request a fresh code. */
export const LOGIN_OTP_MAX_ATTEMPTS = 5;

/** Reduce any phone input to a valid 10-digit Indian mobile number, or ''. */
export function normalizePhone(input) {
  const digits = normalizeIndianMobile(input);
  return /^[6-9]\d{9}$/.test(digits) ? digits : '';
}

/**
 * The test numbers, if any are configured and allowed to work right now.
 *
 * A number that always accepts a known code is a login with the lock taken
 * off, so it is deliberately awkward to leave switched on: it needs numbers
 * AND a code in the environment, and in production it needs
 * OTP_TEST_ALLOW_PROD=true on top of that. Forgetting to remove it from a
 * deploy is the failure this guards against — anyone who knows the pair could
 * otherwise sign in as that lawyer.
 *
 * This is why the pair lives in the environment rather than in this file. A
 * number written into the source is in the repository, in every clone, and in
 * every deploy that ever ships it; a number in `.env` is only wherever someone
 * deliberately put it, and can be removed without a release.
 *
 * OTP_TEST_PHONE takes a comma-separated list, so several people can test
 * without taking the bypass away from each other:
 *   OTP_TEST_PHONE="7740847114,7988140115"
 */
function testLoginConfig() {
  const phones = String(process.env.OTP_TEST_PHONE || '')
    .split(',')
    .map((p) => normalizePhone(p))
    .filter(Boolean);
  const code = String(process.env.OTP_TEST_CODE || '').trim();
  if (!phones.length || !code) return null;
  if (process.env.NODE_ENV === 'production' && process.env.OTP_TEST_ALLOW_PROD !== 'true') {
    return null;
  }
  return { phones, code };
}

/** Whether this number is one of the configured test numbers. */
export function isTestPhone(phone) {
  const cfg = testLoginConfig();
  return Boolean(cfg && cfg.phones.includes(phone));
}

/** Whether this code is the fixed one, for a number allowed to use it. */
export function isTestCode(phone, otp) {
  const cfg = testLoginConfig();
  return Boolean(cfg && cfg.phones.includes(phone) && cfg.code === String(otp).trim());
}

/** Common request shape for both gateway calls. */
async function callGateway(url, body, withToken) {
  const headers = { 'Content-Type': 'application/json' };
  // Only the send endpoint is authenticated; verify is open, which is why the
  // attempt limit below is ours to enforce rather than something we inherit.
  if (withToken) headers['X-App-Token'] = process.env.OTP_TOKEN || '';

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });

  // The gateway answers 200 with a JSON body even for failures, and sometimes
  // with leading blank lines from the PHP that produced it.
  const text = (await res.text()).trim();
  let data = {};
  try {
    data = JSON.parse(text);
  } catch {
    console.error('[login-otp] unparseable gateway reply', res.status, text.slice(0, 200));
    return { ok: false, message: 'Could not reach the SMS service. Please try again.' };
  }

  return { ok: data?.error === false, message: data?.msg || '', data };
}

/**
 * Ask the gateway to text a fresh code to this number.
 * @param {string} phone 10-digit mobile
 */
export async function requestOtp(phone) {
  const url = process.env.OTP_SEND_URL;
  if (!url) {
    console.warn('[login-otp] OTP_SEND_URL is not set — no code was sent.');
    return { ok: false, message: 'SMS is not configured on this server.' };
  }

  try {
    return await callGateway(
      url,
      {
        phoneNumber: phone,
        // Tells the gateway which site the code is for; it keeps a list of
        // permitted sources and rejects anything not on it.
        source: process.env.OTP_SOURCE || 'justiceland',
      },
      true
    );
  } catch (err) {
    console.error('[login-otp] send request failed', err);
    return { ok: false, message: 'Could not reach the SMS service. Please try again.' };
  }
}

/**
 * Ask the gateway whether a submitted code is the one it sent.
 * @param {string} phone 10-digit mobile
 * @param {string} otp   the code the visitor typed
 */
export async function checkOtp(phone, otp) {
  const url = process.env.OTP_VERIFY_URL;
  if (!url) {
    console.warn('[login-otp] OTP_VERIFY_URL is not set — cannot verify.');
    return { ok: false, message: 'SMS is not configured on this server.' };
  }

  try {
    return await callGateway(url, { phoneNumber: phone, newOtp: otp }, false);
  } catch (err) {
    console.error('[login-otp] verify request failed', err);
    return { ok: false, message: 'Could not reach the SMS service. Please try again.' };
  }
}

/* -------------------------------------------------------------------------
   Throttled send / check, shared by the client and lawyer login routes.

   Both need the same guards — a resend cooldown, an hourly ceiling per number
   and a wrong-guess limit — and the reason is the same for both: the gateway's
   verify endpoint is unauthenticated and does not rate-limit, so a 4-digit
   code is a few thousand requests away from anyone, and its send endpoint
   costs money per SMS. Two copies of that logic would be two places for it to
   drift, and the one that drifts is the one nobody is looking at.
   ------------------------------------------------------------------------- */

/** How long a throttle row outlives its last use. */
export const OTP_ROW_TTL_MS = 2 * LOGIN_OTP_WINDOW_MS;

/**
 * Send a code to `phone`, refusing if this number has asked too recently or
 * too often. Does not touch the database for the configured test number.
 *
 * @param {import('mongoose').Model} LoginOtp
 * @param {string} phone normalised 10-digit number
 * @returns {Promise<{ok: boolean, status?: number, body: object}>}
 *   `body` is the JSON to return either way, so callers stay a one-liner.
 */
export async function sendThrottledOtp(LoginOtp, phone) {
  const masked = `••••••${phone.slice(-4)}`;

  // The test number never touches the gateway: no SMS, no throttle row, so it
  // can be hammered while developing without a cooldown getting in the way.
  if (isTestPhone(phone)) {
    console.warn(`[otp/send] TEST NUMBER ${phone} — no SMS sent, fixed code accepted.`);
    return { ok: true, body: { ok: true, sentTo: masked, resendIn: 0, test: true } };
  }

  const now = Date.now();
  const record = await LoginOtp.findOne({ phone });

  if (record) {
    // Resend cooldown — stops a held-down button turning into an SMS bill.
    const since = now - new Date(record.lastSentAt).getTime();
    const wait = Math.ceil((LOGIN_OTP_RESEND_SECONDS * 1000 - since) / 1000);
    if (wait > 0) {
      return {
        ok: false,
        status: 429,
        body: {
          error: 'too-soon',
          retryAfter: wait,
          message: `Please wait ${wait}s before asking for another code.`,
        },
      };
    }

    // Hourly ceiling per number, so one phone cannot be used to send SMS at
    // someone else's expense all day.
    const fresh = now - new Date(record.windowStartedAt).getTime() > LOGIN_OTP_WINDOW_MS;
    if (!fresh && record.sendCount >= LOGIN_OTP_MAX_PER_HOUR) {
      return {
        ok: false,
        status: 429,
        body: {
          error: 'rate-limited',
          message: 'Too many codes requested for this number. Please try again in an hour.',
        },
      };
    }
  }

  const result = await requestOtp(phone);
  if (!result.ok) {
    console.error('[otp/send] gateway refused', result.message);
    return {
      ok: false,
      status: 502,
      body: {
        error: 'send-failed',
        message: result.message || 'We could not send the code right now. Please try again.',
      },
    };
  }

  // Only count a code that actually went out, so a gateway outage does not
  // burn the caller's hourly allowance.
  const fresh =
    !record || now - new Date(record.windowStartedAt).getTime() > LOGIN_OTP_WINDOW_MS;
  await LoginOtp.updateOne(
    { phone },
    {
      $set: {
        lastSentAt: new Date(now),
        // A new code resets the guess counter — the old code is gone.
        attempts: 0,
        expiresAt: new Date(now + OTP_ROW_TTL_MS),
        ...(fresh ? { windowStartedAt: new Date(now), sendCount: 1 } : {}),
      },
      ...(fresh ? {} : { $inc: { sendCount: 1 } }),
    },
    { upsert: true }
  );

  return {
    ok: true,
    body: { ok: true, sentTo: masked, resendIn: LOGIN_OTP_RESEND_SECONDS },
  };
}

/**
 * Check a submitted code, counting wrong guesses against the number.
 *
 * On success the throttle row is deleted, so the next sign-in starts clean.
 *
 * @returns {Promise<{ok: boolean, status?: number, body?: object}>}
 */
export async function checkThrottledOtp(LoginOtp, phone, otp) {
  const throttle = await LoginOtp.findOne({ phone });
  if (throttle && throttle.attempts >= LOGIN_OTP_MAX_ATTEMPTS) {
    return {
      ok: false,
      status: 429,
      body: { error: 'locked', message: 'Too many wrong attempts. Please request a new code.' },
    };
  }

  // The test number's code is checked here rather than at the gateway, which
  // has never heard of it. Everything after this point is the ordinary path,
  // so what gets tested is the real flow and not a second one that only
  // exists in development.
  const result = isTestCode(phone, otp)
    ? { ok: true, message: 'test-code' }
    : await checkOtp(phone, otp);

  if (result.ok && isTestPhone(phone)) {
    console.warn(`[otp/verify] TEST NUMBER ${phone} signed in with the fixed code.`);
  }

  if (!result.ok) {
    if (throttle) {
      throttle.attempts += 1;
      await throttle.save();
    }
    const left = throttle
      ? Math.max(0, LOGIN_OTP_MAX_ATTEMPTS - throttle.attempts)
      : LOGIN_OTP_MAX_ATTEMPTS;
    return {
      ok: false,
      status: 400,
      body: {
        error: 'invalid',
        message: left > 0
          ? `Incorrect code. ${left} ${left === 1 ? 'attempt' : 'attempts'} left.`
          : 'Incorrect code. Please request a new one.',
      },
    };
  }

  await LoginOtp.deleteOne({ phone });
  return { ok: true };
}
