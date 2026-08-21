import crypto from 'crypto';
import Razorpay from 'razorpay';
import { getPaymentConfig } from '@/lib/paymentSettings';

/**
 * Razorpay — server-side client and signature checks.
 *
 * Credentials come from `getPaymentConfig()` (admin panel first, .env second),
 * so everything here is async: the keys can change at runtime when an admin
 * rotates them. Nothing in this module may be imported from a 'use client'
 * file — the key secret is what proves a payment really happened, so leaking
 * it into a browser bundle would let anyone mint wallet balance for free.
 */

export { isRazorpayConfigured } from '@/lib/paymentSettings';

// Cached per key id: rebuilding the client on every request is wasteful, but
// holding one built with a rotated-away key would be worse.
let client = null;
let clientKeyId = '';

/** Razorpay client for the currently-configured keys. Throws if unconfigured. */
export async function getRazorpay() {
  const { keyId, keySecret } = await getPaymentConfig();
  if (!keyId || !keySecret) {
    throw new Error('Razorpay keys are not configured. Set them in /admin/payments.');
  }
  if (!client || clientKeyId !== keyId) {
    client = new Razorpay({ key_id: keyId, key_secret: keySecret });
    clientKeyId = keyId;
  }
  return client;
}

/**
 * Verify the signature the browser hands back after checkout.
 * Razorpay signs `order_id|payment_id` with the key secret, so a client that
 * never actually paid cannot produce a matching digest.
 */
export async function verifyPaymentSignature({ orderId, paymentId, signature }) {
  if (!orderId || !paymentId || !signature) return false;
  const { keySecret } = await getPaymentConfig();
  if (!keySecret) return false;
  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return safeEqual(expected, signature);
}

/** Verify a webhook body against the configured webhook secret. */
export async function verifyWebhookSignature(rawBody, signature) {
  const { webhookSecret } = await getPaymentConfig();
  if (!webhookSecret || !signature) return false;
  const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  return safeEqual(expected, signature);
}

/** True when a webhook secret exists, so the route can 503 with a clear reason. */
export async function hasWebhookSecret() {
  const { webhookSecret } = await getPaymentConfig();
  return Boolean(webhookSecret);
}

/** Constant-time compare that tolerates length mismatches. */
function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** ₹ → paise. Razorpay counts in the smallest currency unit, integers only. */
export function toPaise(rupees) {
  return Math.round(Number(rupees) * 100);
}

/** paise → ₹. */
export function toRupees(paise) {
  return Math.round(Number(paise)) / 100;
}

/**
 * Probe a key pair against Razorpay without storing it.
 *
 * Used before saving credentials from the admin panel: a typo in the secret
 * would otherwise be written straight to the live config and every payment on
 * the site would start failing signature checks. `orders.all` is read-only and
 * the cheapest call that still proves the pair authenticates.
 *
 * `unauthorized` distinguishes "these keys are wrong" — a definite no — from
 * "Razorpay was unreachable", which should not block a config change.
 */
export async function testCredentials(keyId, keySecret) {
  if (!keyId || !keySecret) return { ok: false, unauthorized: true };
  try {
    const probe = new Razorpay({ key_id: keyId, key_secret: keySecret });
    await probe.orders.all({ count: 1 });
    return { ok: true, unauthorized: false };
  } catch (err) {
    const status = err?.statusCode;
    return {
      ok: false,
      unauthorized: status === 401 || status === 400,
      status: status || 0,
    };
  }
}
