/**
 * SMS delivery.
 *
 * Configure in .env.local:
 *   SMS_API_URL          gateway endpoint
 *   SMS_API_KEY          gateway key — presence of this is what turns SMS on
 *   SMS_SENDER_ID        approved 6-character header, e.g. JSTLND
 *   SMS_ENTITY_ID        DLT principal entity ID
 *   SMS_OTP_TEMPLATE_ID  DLT template ID for the OTP message below
 *   SMS_BRAND_NAME       brand as registered in that template (default Justiceland)
 *
 * Without SMS_API_KEY the code is logged to the server console instead, so the
 * flow stays testable in development without spending a message.
 */

/** Reduce any phone string to the 10-digit Indian mobile number. */
export function normalizeIndianMobile(phone = '') {
  const digits = String(phone).replace(/\D/g, '');
  // Drop a leading country code (91) or trunk 0 if present.
  return digits.slice(-10);
}

/** Whether a real gateway is configured. */
export function smsEnabled() {
  return Boolean(process.env.SMS_API_KEY && process.env.SMS_API_URL);
}

/**
 * The OTP message text.
 *
 * This MUST match the registered DLT template word for word — operators drop
 * anything that does not, and they drop it silently, so a mismatch looks
 * exactly like a phone that never received the SMS. Only the code varies; the
 * brand has to be the one the template was registered with.
 */
export function buildOtpMessage(otp) {
  const brand = process.env.SMS_BRAND_NAME || 'Justiceland';
  return `Dear Customer, Your OTP for ${brand} profile verification is ${otp}. Regards, ${brand}`;
}

/** The gateway wants bare digits with the country code, e.g. 91XXXXXXXXXX. */
function toGatewayNumber(number) {
  const ten = normalizeIndianMobile(number);
  return ten ? `91${ten}` : '';
}

/**
 * Send an OTP by SMS.
 *
 * Never throws — the caller has already stored the code, and a gateway outage
 * should surface as a clear "could not send" rather than a 500.
 *
 * @param {{ phone: string, otp: string }} params
 * @returns {Promise<{ delivered: boolean, error?: string, response?: string }>}
 */
export async function sendOtpSms({ phone, otp }) {
  const to = toGatewayNumber(phone);
  if (!to || to.length !== 12) {
    return { delivered: false, error: 'invalid-number' };
  }

  if (!smsEnabled()) {
    console.warn(
      `\n[sms] SMS_API_KEY not set — SMS NOT sent.\n  To: ${to}\n  OTP: ${otp}\n`
    );
    return { delivered: false, error: 'not-configured' };
  }

  const url =
    `${process.env.SMS_API_URL}?` +
    new URLSearchParams({
      key: process.env.SMS_API_KEY,
      from: process.env.SMS_SENDER_ID || '',
      to,
      body: buildOtpMessage(otp),
      entityid: process.env.SMS_ENTITY_ID || '',
      templateid: process.env.SMS_OTP_TEMPLATE_ID || '',
    }).toString();

  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(15000),
    });
    const text = (await res.text()).trim();

    if (!res.ok) {
      console.error(`[sms] gateway HTTP ${res.status} for ${to}: ${text}`);
      return { delivered: false, error: `HTTP ${res.status}`, response: text };
    }

    // A 200 is not proof of acceptance: these gateways answer "invalid key" or
    // "template mismatch" with a 200 and an error in the body. Treat anything
    // that reads as a failure as one, rather than telling someone to check a
    // phone that will never buzz.
    if (/invalid|error|fail|unauthor|reject|insufficient|denied/i.test(text)) {
      console.error(`[sms] gateway refused for ${to}: ${text}`);
      return { delivered: false, error: 'gateway-refused', response: text };
    }

    console.log(`[sms] OTP sent to ${to} → ${text}`);
    return { delivered: true, response: text };
  } catch (err) {
    console.error(`[sms] failed to send OTP to ${to}: ${err.message}`);
    return { delivered: false, error: err.message };
  }
}
