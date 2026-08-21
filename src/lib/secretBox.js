import crypto from 'crypto';

/**
 * secretBox — authenticated encryption for secrets kept in the database.
 *
 * Used for the Razorpay key secret and webhook secret, which the admin can now
 * edit from the panel. Storing them as plain text would mean a leaked database
 * backup is enough to take payments in Justiceland's name, so they are sealed
 * with AES-256-GCM under a key derived from JWT_SECRET — which lives in the
 * environment and never in Mongo.
 *
 * GCM rather than CBC because it authenticates: tampering with the ciphertext
 * fails loudly at decrypt instead of quietly producing a different secret.
 */

const VERSION = 'v1';

/** 32-byte key derived from JWT_SECRET. Throws if that isn't configured. */
function derivedKey() {
  const base = process.env.JWT_SECRET || '';
  if (!base) throw new Error('JWT_SECRET is required to encrypt payment secrets.');
  // Fixed salt: this needs to be deterministic across restarts, and the input
  // is already a long random secret rather than a guessable password.
  return crypto.scryptSync(base, 'lci-payment-secret', 32);
}

/** Encrypt a string. Returns `v1:<iv>:<tag>:<ciphertext>`, all base64url. */
export function seal(plain) {
  const text = String(plain ?? '');
  if (!text) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey(), iv);
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString('base64url'), tag.toString('base64url'), enc.toString('base64url')].join(':');
}

/**
 * Decrypt a sealed string. Returns '' rather than throwing when the value is
 * empty, malformed, or was sealed under a different JWT_SECRET — the caller
 * treats that the same as "not configured" and falls back to the environment.
 */
export function open(sealed) {
  const value = String(sealed || '');
  if (!value) return '';
  try {
    const [version, ivB64, tagB64, dataB64] = value.split(':');
    if (version !== VERSION || !ivB64 || !tagB64 || !dataB64) return '';
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      derivedKey(),
      Buffer.from(ivB64, 'base64url')
    );
    decipher.setAuthTag(Buffer.from(tagB64, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(dataB64, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    return '';
  }
}

/** `rzp_live_TNDSjoB766ViCg` → `rzp_live_…6ViCg`. Safe to show in the panel. */
export function maskKey(value) {
  const s = String(value || '');
  if (!s) return '';
  if (s.length <= 8) return '••••';
  return `${s.slice(0, 8)}…${s.slice(-4)}`;
}

/** A secret is never shown, only its length hint. */
export function maskSecret(value) {
  return value ? `${'•'.repeat(20)} (saved)` : '';
}
