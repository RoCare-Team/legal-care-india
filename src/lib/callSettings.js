import { connectDB } from '@/lib/db';
import CallSetting from '@/models/CallSetting';

/**
 * The dialler's on/off switch, read from the database.
 *
 * Separate from `isDialerConfigured()` in `tataDialer.js`: that checks whether
 * a Smartflo token *exists*, this checks whether an admin has *turned calling
 * on*. Off by default — a fresh install, or one where nobody has flipped this
 * on yet, must not place calls just because a token happens to be set.
 */

const PROVIDER = 'tataDialer';

// Short in-process cache, same TTL and reasoning as `paymentSettings.js`: cheap
// to read on every booking, and a toggle from the panel still lands in ~60s
// (instantly via `clearCallSettingsCache`).
const TTL_MS = 60_000;
let cache = null;
let cachedAt = 0;

/** Drop the cache so the next read sees a freshly-saved toggle. */
export function clearCallSettingsCache() {
  cache = null;
  cachedAt = 0;
}

/** True only when an admin has explicitly switched calling on. */
export async function isCallingEnabled() {
  if (cache && Date.now() - cachedAt < TTL_MS) return cache.enabled;

  let enabled = false;
  try {
    await connectDB();
    const doc = await CallSetting.findOne({ provider: PROVIDER }).select('enabled').lean();
    enabled = Boolean(doc?.enabled);
  } catch (err) {
    // A database blip must default to OFF, not silently start placing calls.
    console.error('call settings read failed, defaulting to off', err);
    enabled = false;
  }

  cache = { enabled };
  cachedAt = Date.now();
  return enabled;
}

/** What the admin panel shows: the toggle state plus the audit line. */
export async function getCallSettingsForAdmin() {
  await connectDB();
  const doc = await CallSetting.findOne({ provider: PROVIDER }).lean();
  return {
    enabled: Boolean(doc?.enabled),
    updatedBy: doc?.updatedBy || '',
    updatedAt: doc?.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
  };
}

/** Flip the switch from the admin panel. */
export async function setCallingEnabled(enabled, updatedBy = '') {
  await connectDB();
  await CallSetting.findOneAndUpdate(
    { provider: PROVIDER },
    { $set: { provider: PROVIDER, enabled: Boolean(enabled), updatedBy: String(updatedBy || '') } },
    { upsert: true, new: true }
  );
  clearCallSettingsCache();
  return getCallSettingsForAdmin();
}
