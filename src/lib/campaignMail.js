/**
 * Bulk email through Limbutech's campaign API.
 *
 * One request, many recipients, with `{{name|fallback}}` merged per contact —
 * which is why approving forty lawyers sends one campaign rather than forty
 * SMTP messages through the transporter in lib/mailer.
 *
 * That transporter is still the right tool for anything addressed to one
 * person: an OTP, a password reset, a booking notice. This is only for the
 * cases where the same message goes to a list.
 *
 * Configure in .env:
 *   LIMBU_MAIL_API_KEY   the bearer token
 *   LIMBU_MAIL_URL       optional, defaults to the production endpoint
 *
 * With no key configured nothing is sent and the caller is told so, the same
 * way lib/mailer degrades — a missing key must never fail the action that
 * happened to trigger an email.
 */
const DEFAULT_URL = 'https://mail.limbutech.in/api/v1/campaigns/send';

/** The API refuses more than this in one call; longer lists are chunked. */
const MAX_CONTACTS = 500;

/** Split a list into chunks of at most `size`. */
function chunk(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

/**
 * Send one campaign.
 *
 * @param {object} campaign
 * @param {string} campaign.name      what the send is called in the dashboard
 * @param {string} campaign.subject
 * @param {string} campaign.html      may use {{name|there}}
 * @param {Array<{email: string, name?: string}>} campaign.contacts
 * @returns {Promise<{sent: number, skipped: string}>}
 *   `skipped` is a reason when nothing went out, empty when it did.
 */
export async function sendCampaign({ name, subject, html, contacts }) {
  const key = process.env.LIMBU_MAIL_API_KEY;
  const url = process.env.LIMBU_MAIL_URL || DEFAULT_URL;

  // De-duplicate on the address: the same lawyer approved twice in one
  // selection, or two records sharing a mailbox, must not be mailed twice.
  const seen = new Set();
  const recipients = (contacts || []).filter((c) => {
    const email = String(c?.email || '').trim().toLowerCase();
    if (!email || !email.includes('@') || seen.has(email)) return false;
    seen.add(email);
    return true;
  });

  if (recipients.length === 0) return { sent: 0, skipped: 'no valid recipients' };
  if (!key) {
    console.warn(
      `[campaignMail] LIMBU_MAIL_API_KEY not set — "${name}" NOT sent to ${recipients.length} recipient(s).`
    );
    return { sent: 0, skipped: 'mail API key not configured' };
  }

  let sent = 0;
  for (const batch of chunk(recipients, MAX_CONTACTS)) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        subject,
        html,
        // These are people who registered an account and are being told what
        // happened to it — a transactional notice, not marketing.
        consent: true,
        contacts: batch.map((c) => ({
          email: String(c.email).trim(),
          name: String(c.name || '').trim(),
        })),
      }),
      cache: 'no-store',
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`campaign send failed (${res.status}): ${detail.slice(0, 300)}`);
    }
    sent += batch.length;
  }

  return { sent, skipped: '' };
}
