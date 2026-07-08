import nodemailer from 'nodemailer';

/**
 * Email sending helper.
 *
 * Configure SMTP in .env.local to send real emails:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
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
 * Send an email. Returns { delivered: boolean }.
 * @param {{ to: string, subject: string, html: string, text?: string }} message
 */
export async function sendEmail({ to, subject, html, text }) {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || 'Legal Care India <no-reply@legalcareindia.com>';

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
    subject: `${otp} is your Legal Care India password reset code`,
    text: `Hi ${safeName},\n\nYour password reset OTP is: ${otp}\n\nEnter this code on the reset page to set a new password. It is valid for 10 minutes.\n\nIf you didn't request this, you can safely ignore this email.\n\n— Legal Care India`,
    html: `
      <div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#0f172a">
        <div style="background:#0f766e;border-radius:14px;padding:20px 24px;color:#fff">
          <strong style="font-size:18px">Legal Care India</strong>
        </div>
        <h2 style="margin:24px 0 8px">Your password reset code</h2>
        <p style="color:#475569;line-height:1.6">Hi ${safeName}, use the code below to reset your password. It is valid for <strong>10 minutes</strong>.</p>
        <div style="margin:24px 0;text-align:center">
          <span style="display:inline-block;background:#f0fdfa;border:1px solid #99f6e4;color:#0f766e;font-size:34px;font-weight:800;letter-spacing:10px;padding:16px 28px;border-radius:14px">${otp}</span>
        </div>
        <p style="color:#94a3b8;font-size:13px;margin-top:24px">If you didn't request this, you can safely ignore this email — your password won't change. Never share this code with anyone.</p>
      </div>
    `,
  };
}
