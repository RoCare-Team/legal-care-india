/**
 * Per-minute consultation rates.
 *
 * A lawyer sets one number per channel — ₹ per minute for chat, audio and
 * video — and a session bills the minutes it actually ran. This replaces the
 * old fixed { minutes, price } plans, where a call that ended after two
 * minutes still cost the client the whole thirty-minute plan.
 *
 * The legacy plan arrays are still on older documents, so `advocateRate` falls
 * back to converting them (price ÷ minutes) rather than reading ₹0 and making
 * an established lawyer look unbookable.
 */

/** Bounds, so a typo can't create a ₹0 or ₹1,00,000-a-minute consultation. */
export const MIN_RATE = 1;
export const MAX_RATE = 5000;

/** The three channels a session can run on, in the order they're presented. */
export const RATE_FIELDS = [
  { key: 'chatRate', type: 'chat', label: 'Live Chat' },
  { key: 'audioRate', type: 'audio', label: 'Audio Call' },
  { key: 'videoRate', type: 'video', label: 'Video Call' },
];

/** Legacy plan field backing each rate, for documents saved before the change. */
const LEGACY_PLANS = {
  chatRate: 'consultationPlans',
  audioRate: 'audioPlans',
  videoRate: 'videoPlans',
};

/** A raw rate coerced into a whole rupee amount within bounds, or 0. */
export function normalizeRate(raw) {
  const n = Math.round(Number(raw));
  if (!Number.isFinite(n) || n < MIN_RATE || n > MAX_RATE) return 0;
  return n;
}

/**
 * Convert a legacy fixed plan list into a per-minute rate.
 *
 * The cheapest per-minute row wins rather than an average: a lawyer whose
 * plans were 15min/₹500 and 60min/₹1200 was already offering the longer call
 * at a discount, and billing per minute at the higher rate would quietly raise
 * their price. Erring downward keeps the conversion in the client's favour.
 *
 * @param {Array<{minutes:any,price:any}>} [plans]
 * @returns {number} ₹ per minute, or 0 if there is nothing to convert
 */
export function rateFromPlans(plans = []) {
  const rates = (plans || [])
    .map((p) => Number(p?.price) / Number(p?.minutes))
    .filter((r) => Number.isFinite(r) && r > 0);
  if (!rates.length) return 0;
  return normalizeRate(Math.max(MIN_RATE, Math.ceil(Math.min(...rates))));
}

/**
 * A lawyer's per-minute rate for one channel — their own if they've set one,
 * otherwise converted from whatever plans they had before.
 *
 * @param {object} advocate
 * @param {'chat'|'audio'|'video'} type
 * @returns {number} 0 ⇒ they don't offer this channel
 */
export function advocateRate(advocate, type = 'chat') {
  const field = RATE_FIELDS.find((f) => f.type === type);
  if (!field || !advocate) return 0;
  const own = normalizeRate(advocate[field.key]);
  if (own) return own;
  return rateFromPlans(advocate[LEGACY_PLANS[field.key]]);
}

/** All three rates at once, keyed by channel. */
export function advocateRates(advocate) {
  return {
    chat: advocateRate(advocate, 'chat'),
    audio: advocateRate(advocate, 'audio'),
    video: advocateRate(advocate, 'video'),
  };
}

/** "₹25/min" — the label used wherever a rate is shown. */
export function formatRate(rate) {
  const n = Number(rate) || 0;
  return n > 0 ? `₹${n.toLocaleString('en-IN')}/min` : '';
}

/**
 * How long a wallet balance buys at this rate, in whole minutes.
 * Used both to refuse a call nobody can afford and to cut one off in time.
 */
export function affordableMinutes(balance, rate) {
  const r = Number(rate) || 0;
  if (r <= 0) return 0;
  return Math.floor((Number(balance) || 0) / r);
}

/**
 * What a session that ran `ms` milliseconds costs.
 *
 * Billed per whole minute, rounded up, with a one-minute minimum — the same
 * way every telecom in the country bills a call, and the reason a lawyer who
 * picks up for twenty seconds is not paid nothing.
 */
export function chargeForDuration(ms, rate) {
  const r = normalizeRate(rate);
  if (!r) return { minutes: 0, amount: 0 };
  const minutes = Math.max(1, Math.ceil((Number(ms) || 0) / 60000));
  return { minutes, amount: minutes * r };
}
