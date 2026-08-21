import { connectDB } from '@/lib/db';
import PaymentSetting from '@/models/PaymentSetting';
import { seal, open, maskKey, maskSecret } from '@/lib/secretBox';

/**
 * Razorpay credentials, read from the database first and the environment
 * second.
 *
 * The admin panel writes to the database, so keys can be rotated from /admin
 * without a redeploy. The .env values stay as the fallback — that is what the
 * site runs on before anyone has saved anything in the panel, and what it
 * falls back to if the stored secret cannot be decrypted.
 */

const PROVIDER = 'razorpay';

// Short in-process cache. Every payment request would otherwise hit Mongo just
// to read three strings; 60s is short enough that a key rotation takes effect
// almost immediately, and `clearPaymentConfigCache` makes it instant.
const TTL_MS = 60_000;
let cache = null;
let cachedAt = 0;

/** Drop the cache so the next read sees freshly-saved keys. */
export function clearPaymentConfigCache() {
  cache = null;
  cachedAt = 0;
}

/** 'live' | 'test' | 'unknown', from the key id prefix. */
export function keyMode(keyId) {
  const s = String(keyId || '');
  if (s.startsWith('rzp_live_')) return 'live';
  if (s.startsWith('rzp_test_')) return 'test';
  return 'unknown';
}

/**
 * The credentials to use right now.
 * `{ keyId, keySecret, webhookSecret, mode, source }` — source is 'admin' when
 * they came from the panel, 'env' from .env, or 'none' when unconfigured.
 */
export async function getPaymentConfig() {
  if (cache && Date.now() - cachedAt < TTL_MS) return cache;

  const envConfig = {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    source: 'env',
  };

  let config = envConfig;

  try {
    await connectDB();
    const doc = await PaymentSetting.findOne({ provider: PROVIDER }).lean();
    const keyId = doc?.keyId || '';
    const keySecret = open(doc?.keySecretEnc);

    // Both halves must survive. A key id with an undecryptable secret is worse
    // than useless — it would sign every payment wrong — so fall back whole.
    if (keyId && keySecret) {
      config = {
        keyId,
        keySecret,
        // The webhook secret is independent: the admin may not have set one.
        webhookSecret: open(doc?.webhookSecretEnc) || '',
        source: 'admin',
      };
    } else if (doc?.keyId && !keySecret) {
      console.warn('payment settings: stored key secret could not be decrypted; using .env');
    }
  } catch (err) {
    // A database blip must not take payments down when .env has working keys.
    console.error('payment settings read failed, falling back to env', err);
  }

  if (!config.keyId || !config.keySecret) config = { ...config, source: 'none' };

  cache = { ...config, mode: keyMode(config.keyId) };
  cachedAt = Date.now();
  return cache;
}

/** True when there is a usable key pair from either source. */
export async function isRazorpayConfigured() {
  const c = await getPaymentConfig();
  return Boolean(c.keyId && c.keySecret);
}

/**
 * Save keys entered in the admin panel. A blank `keySecret` or `webhookSecret`
 * means "leave the stored one alone" — the panel never receives the real
 * secret back, so it cannot echo it to us on every save.
 */
export async function savePaymentConfig({ keyId, keySecret, webhookSecret, updatedBy = '' }) {
  await connectDB();

  const update = {
    provider: PROVIDER,
    keyId: String(keyId || '').trim(),
    mode: keyMode(keyId),
    updatedBy: String(updatedBy || ''),
  };

  if (String(keySecret || '').trim()) update.keySecretEnc = seal(String(keySecret).trim());

  // Explicit null clears the webhook secret; blank leaves it untouched.
  if (webhookSecret === null) update.webhookSecretEnc = '';
  else if (String(webhookSecret || '').trim()) update.webhookSecretEnc = seal(String(webhookSecret).trim());

  await PaymentSetting.findOneAndUpdate({ provider: PROVIDER }, { $set: update }, {
    upsert: true,
    new: true,
  });

  clearPaymentConfigCache();
  return getPaymentConfig();
}

/** What the admin panel is allowed to see: ids masked, secrets never. */
export async function getPaymentConfigForAdmin() {
  await connectDB();
  const doc = await PaymentSetting.findOne({ provider: PROVIDER }).lean();
  const active = await getPaymentConfig();

  return {
    // The full key id is fine to show — it ships to every browser anyway, and
    // the admin needs to read it to confirm which account is live.
    keyId: doc?.keyId || '',
    keySecretMasked: maskSecret(open(doc?.keySecretEnc)),
    webhookSecretMasked: maskSecret(open(doc?.webhookSecretEnc)),
    hasKeySecret: Boolean(open(doc?.keySecretEnc)),
    hasWebhookSecret: Boolean(open(doc?.webhookSecretEnc)),
    mode: active.mode,
    source: active.source,
    envKeyIdMasked: maskKey(process.env.RAZORPAY_KEY_ID || ''),
    updatedBy: doc?.updatedBy || '',
    updatedAt: doc?.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
  };
}
