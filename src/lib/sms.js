/**
 * SMS sending via Fast2SMS (https://www.fast2sms.com).
 *
 * Configure in .env.local:
 *   FAST2SMS_API_KEY   — your Fast2SMS "API Key" (Dev API section)
 *
 * If the key is missing, the OTP is logged to the server console instead of
 * being sent — so the flow stays testable in development.
 */

/** Reduce any phone string to the 10-digit Indian mobile number. */
export function normalizeIndianMobile(phone = '') {
  const digits = String(phone).replace(/\D/g, '');
  // Drop a leading country code (91) or trunk 0 if present.
  return digits.slice(-10);
}

/**
 * Send a password-reset OTP over SMS.
 * @param {{ phone: string, otp: string }} params
 * @returns {Promise<{ delivered: boolean, error?: string }>}
 */
export async function sendOtpSms({ phone, otp }) {
  const apiKey = process.env.FAST2SMS_API_KEY;
  const number = normalizeIndianMobile(phone);

  if (!number || number.length !== 10) {
    return { delivered: false, error: 'invalid-number' };
  }

  if (!apiKey) {
    console.warn(
      `\n[sms] FAST2SMS_API_KEY not set — SMS NOT sent.\n  To: ${number}\n  OTP: ${otp}\n`
    );
    return { delivered: false, error: 'not-configured' };
  }

  try {
    // Fast2SMS "otp" route: sends "<otp> is your OTP" from a shared sender.
    const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        authorization: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: 'otp',
        variables_values: String(otp),
        numbers: number,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.return === false) {
      console.error('[sms] Fast2SMS error', data);
      return { delivered: false, error: data?.message || 'send-failed' };
    }
    return { delivered: true };
  } catch (err) {
    console.error('[sms] Fast2SMS request failed', err);
    return { delivered: false, error: 'request-failed' };
  }
}
