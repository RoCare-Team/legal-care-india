import { normalizeIndianMobile } from '@/lib/sms';

/**
 * WhatsApp template campaigns through Limbu.
 *
 * One request carries many recipients, each with its own positional template
 * parameters — so approving forty lawyers is one call, not forty.
 *
 * Configure in .env:
 *   LIMBU_WA_API_KEY             the key from the campaign's Test API dialog
 *   LIMBU_WA_URL                 optional, defaults to the production base
 *   LIMBU_WA_APPROVED_CAMPAIGN   optional, the campaign approval messages use
 *
 * With no key configured nothing is sent and the caller is told why, the same
 * way lib/mailer and lib/campaignMail degrade. A notification that cannot go
 * out must never fail the thing it was notifying about.
 */
const DEFAULT_BASE = 'https://whatsapp.limbu.ai/api/campaigns';

/** The API accepts up to this many messages in one request. */
const MAX_MESSAGES = 5000;

/** The campaign sent when an admin publishes a lawyer's profile. */
export const APPROVED_CAMPAIGN =
  process.env.LIMBU_WA_APPROVED_CAMPAIGN || 'profile_approved_campaign';

/**
 * A phone as WhatsApp wants it: country code, bare digits, no plus.
 *
 * Numbers reach this from two eras of the registration form and are stored
 * exactly as they were typed — some bare ten digits, some already carrying
 * `+91`. Reducing to the last ten and putting one country code back on is what
 * makes both forms come out the same.
 *
 * Returns '' for anything that is not a plausible Indian mobile, so a blank or
 * half-typed number is dropped here rather than rejected by the gateway.
 *
 * @param {string} phone
 * @returns {string} e.g. '918369120163', or '' if unusable
 */
export function toWhatsAppNumber(phone) {
  const ten = normalizeIndianMobile(phone);
  // Indian mobiles start 6–9. A landline or a truncated entry would be
  // accepted by the gateway and then simply never arrive.
  return /^[6-9]\d{9}$/.test(ten) ? `91${ten}` : '';
}

/**
 * The name a template greets someone by.
 *
 * Lawyers register as "Adv Tanaji Londhe" or "Advocate Neeraj Pandey", and a
 * message opening "Hello Adv" is worse than one opening with nothing. The
 * honorific comes off and the first real word is what is left.
 *
 * @param {string} name
 * @returns {string}
 */
export function firstName(name) {
  const cleaned = String(name || '')
    .replace(/^(adv|advocate|shri|smt|mr|mrs|ms|dr)\.?\s+/i, '')
    .trim();
  return cleaned.split(/\s+/)[0] || 'there';
}

/**
 * Send one template campaign.
 *
 * @param {object} options
 * @param {string} options.campaign               campaign name in the URL
 * @param {Array<{phone: string, params?: string[]}>} options.recipients
 * @returns {Promise<{sent: number, skipped: string}>}
 *   `skipped` carries a reason when nothing went out, and is empty when it did.
 */
export async function sendWhatsAppCampaign({ campaign, recipients }) {
  const key = process.env.LIMBU_WA_API_KEY;
  const base = process.env.LIMBU_WA_URL || DEFAULT_BASE;

  // Normalise, drop what cannot be delivered, and de-duplicate on the number:
  // two records sharing a mobile must not both message it.
  const seen = new Set();
  const messages = [];
  for (const person of recipients || []) {
    const destination = toWhatsAppNumber(person?.phone);
    if (!destination || seen.has(destination)) continue;
    seen.add(destination);
    messages.push({
      destination,
      templateParams: (person.params || []).map((p) => String(p ?? '')),
    });
  }

  if (messages.length === 0) return { sent: 0, skipped: 'no valid mobile numbers' };
  if (!key) {
    console.warn(
      `[whatsapp] LIMBU_WA_API_KEY not set — "${campaign}" NOT sent to ${messages.length} number(s).`
    );
    return { sent: 0, skipped: 'WhatsApp API key not configured' };
  }

  const url = `${base.replace(/\/$/, '')}/${encodeURIComponent(campaign)}/send`;

  let sent = 0;
  for (let i = 0; i < messages.length; i += MAX_MESSAGES) {
    const batch = messages.slice(i, i + MAX_MESSAGES);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // The key travels in the body, not a header — that is this gateway's
      // contract, not a choice made here.
      body: JSON.stringify({ apiKey: key, messages: batch }),
      cache: 'no-store',
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`whatsapp send failed (${res.status}): ${detail.slice(0, 300)}`);
    }
    sent += batch.length;
  }

  return { sent, skipped: '' };
}
