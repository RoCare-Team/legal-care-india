import nodemailer from 'nodemailer';

/**
 * Email sending helper.
 *
 * Configure SMTP in .env.local to send real emails:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_FROM_INFO
 *
 * One connection, two From addresses. Most providers let an authenticated
 * mailbox send as another on the same domain; if yours does not, the info
 * address simply needs its own credentials and a second transporter.
 *
 * If SMTP is not configured, emails are logged to the server console instead
 * (handy in development — you can copy the reset link from the terminal).
 */

let cachedTransporter;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  cachedTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465, // true for 465, false for 587/25
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return cachedTransporter;
}

/**
 * Who a message goes out as.
 *
 * Two mailboxes, because a reply goes back to whoever sent it: an account
 * email sent from `info@` would have people asking for a password reset in the
 * queue meant for careers and partnerships. `support` is the default because
 * everything the site sends on its own — OTPs, notices — is support.
 */
const SENDERS = {
  support: () => process.env.SMTP_FROM || 'Justiceland <support@justiceland.online>',
  info: () => process.env.SMTP_FROM_INFO || 'Justiceland <info@justiceland.online>',
};

/**
 * Send an email. Returns { delivered: boolean }.
 * @param {{ to: string, subject: string, html: string, text?: string,
 *          sender?: 'support'|'info' }} message
 */
export async function sendEmail({ to, subject, html, text, sender = 'support' }) {
  const transporter = getTransporter();
  const from = (SENDERS[sender] || SENDERS.support)();

  if (!transporter) {
    // Dev fallback — no SMTP configured. Log so the flow is still testable.
    console.warn(
      `\n[mailer] SMTP not configured — email NOT sent.\n  To: ${to}\n  Subject: ${subject}\n  ${text || ''}\n`
    );
    return { delivered: false };
  }

  await transporter.sendMail({ from, to, subject, html, text });
  return { delivered: true };
}

/** Branded HTML for the password-reset OTP email. */
export function passwordResetEmail({ name, otp }) {
  const safeName = name || 'there';
  return {
    subject: `${otp} is your Justiceland password reset code`,
    text: `Hi ${safeName},\n\nYour password reset OTP is: ${otp}\n\nEnter this code on the reset page to set a new password. It is valid for 10 minutes.\n\nIf you didn't request this, you can safely ignore this email.\n\n— Justiceland`,
    html: `
      <div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#0f172a">
        <div style="background:#1E3A5F;border-radius:14px;padding:20px 24px;color:#fff">
          <strong style="font-size:18px">Justiceland</strong>
        </div>
        <h2 style="margin:24px 0 8px">Your password reset code</h2>
        <p style="color:#475569;line-height:1.6">Hi ${safeName}, use the code below to reset your password. It is valid for <strong>10 minutes</strong>.</p>
        <div style="margin:24px 0;text-align:center">
          <span style="display:inline-block;background:#f8fafc;border:1px solid #D4AF37;color:#1E3A5F;font-size:34px;font-weight:800;letter-spacing:10px;padding:16px 28px;border-radius:14px">${otp}</span>
        </div>
        <p style="color:#94a3b8;font-size:13px;margin-top:24px">If you didn't request this, you can safely ignore this email — your password won't change. Never share this code with anyone.</p>
      </div>
    `,
  };
}
