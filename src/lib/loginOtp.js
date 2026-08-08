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
