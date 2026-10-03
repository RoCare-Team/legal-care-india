import crypto from 'crypto';

/**
 * Signed, expiring links to a chat attachment.
 *
 * The mobile app signs in with a cookie that lives inside the app, so a PDF
 * handed to the phone's browser or viewer arrives without it and is refused.
 * A signed link carries its own short-lived permission instead: whoever has
 * it can read that one file until it expires, and nothing else.
 *
 * The expiry is rounded up to the next whole hour plus one, so the link is
 * the same on every 2-second poll within the hour (images cache) and is
 * always valid for at least an hour after it was handed out.
 */

const HOUR = 3600;

function secret() {
  const base = process.env.JWT_SECRET || '';
  if (!base) throw new Error('JWT_SECRET is required to sign attachment links.');
  return `${base}:chat-attachment`;
}

function sign(id, exp) {
  return crypto.createHmac('sha256', secret()).update(`${id}.${exp}`).digest('base64url');
}

/** `/api/consultations/attachments/<id>?e=<exp>&t=<sig>` */
export function signedAttachmentPath(id) {
  const now = Math.floor(Date.now() / 1000);
  const exp = (Math.floor(now / HOUR) + 2) * HOUR;
  return `/api/consultations/attachments/${id}?e=${exp}&t=${sign(String(id), exp)}`;
}

/** True when `t` is a valid, unexpired signature for this attachment. */
export function verifyAttachmentLink(id, exp, token) {
  const e = Number(exp);
  if (!Number.isFinite(e) || e < Math.floor(Date.now() / 1000) || !token) return false;
  const expected = Buffer.from(sign(String(id), e));
  const given = Buffer.from(String(token));
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}
