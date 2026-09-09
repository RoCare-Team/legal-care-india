/**
 * The blocks of time a client can book, and what they cost.
 *
 * A slot is two things: how long the client is booking, and the most it can
 * cost them. It is not what they are charged. The session still bills the
 * minutes it actually runs — a client who books thirty minutes and finishes in
 * ten pays for ten — so the slot is a ceiling, not a ticket.
 *
 * That is why `rateFor` exists: the per-minute rate a session bills at is the
 * slot's price spread across its minutes. The billing engine in
 * lib/consultations already works in `rate` and `maxMinutes`, so a slot is
 * simply a friendlier way of choosing both at once.
 *
 * Each price has a default, used only while the lawyer has not set their own.
 * The moment they enter a figure, that figure is what applies.
 */

/** The three blocks, shortest first. `minutes` is also the key they are stored under. */
export const CONSULTATION_SLOTS = [
  { minutes: 10, label: '10 min', defaultPrice: 200 },
  { minutes: 30, label: '30 min', defaultPrice: 500 },
  { minutes: 60, label: '1 hour', defaultPrice: 1000 },
];

/** The two the directory card leads with — the rest are on the profile. */
export const CARD_SLOT_MINUTES = [10, 30];

/**
 * The three ways a consultation happens, each priced separately.
 *
 * A lawyer does not value the three the same way: ten minutes of typing is not
 * ten minutes on camera, and being asked to quote one figure for both was the
 * reason the prices here were guesses. So each channel carries its own three
 * slots — nine figures in all.
 *
 * `card` marks the one the directory quotes. A card has room for one line, and
 * nine figures do not fit in it; chat is the cheapest way in and the one most
 * clients start with, so that is the line the card shows.
 */
export const CONSULTATION_CHANNELS = [
  { key: 'chat', label: 'Chat', blurb: 'Typed messages', card: true },
  { key: 'audio', label: 'Call', blurb: 'Voice call' },
  { key: 'video', label: 'Video', blurb: 'Video call' },
];

/** Whether a value names one of the three channels. */
export function isChannel(value) {
  return CONSULTATION_CHANNELS.some((c) => c.key === value);
}

/**
 * How a per-channel price is stored: "chat:10", "audio:30", "video:60".
 *
 * One map with compound keys rather than three maps, for one reason: the 395
 * lawyers who already have prices have them under the bare minutes — "10",
 * "30", "60" — and those keys keep working untouched. A lawyer who never opens
 * the new form is priced exactly as they were, and one who does simply adds
 * more entries to the same map. No migration, and no day on which the two
 * shapes disagree.
 */
export function slotKey(channel, minutes) {
  return `${channel}:${minutes}`;
}

/** Bounds, so a typo cannot create a ₹0 or ₹5,00,000 consultation. */
export const MIN_SLOT_PRICE = 1;
export const MAX_SLOT_PRICE = 200000;

/** A raw price coerced to whole rupees within bounds, or 0 for "not set". */
export function normalizeSlotPrice(raw) {
  const n = Math.round(Number(raw));
  if (!Number.isFinite(n) || n < MIN_SLOT_PRICE || n > MAX_SLOT_PRICE) return 0;
  return n;
}

/**
 * What this lawyer charges for a slot.
 *
 * Their own figure if they have set one, otherwise the platform default. A
 * lawyer who has never opened the pricing form is still bookable at a sensible
 * price rather than being unbookable at ₹0 — which is what an unset rate used
 * to mean, and why a new registration could sit in the directory taking
 * nothing.
 *
 * @param {object} advocate
 * @param {number} minutes  one of CONSULTATION_SLOTS
 * @returns {number} rupees
 */
export function slotPrice(advocate, minutes, channel) {
  const slot = CONSULTATION_SLOTS.find((s) => s.minutes === Number(minutes));
  if (!slot) return 0;

  // Stored as a Map on the document and as a plain object once serialised, so
  // both shapes are read the same way.
  const prices = advocate?.slotPrices;
  const read = (key) =>
    prices instanceof Map ? prices.get(String(key)) : prices?.[key];

  // Their price for this channel, then the one they set before channels
  // existed, then ours. Each step is a real answer, so the first one found
  // wins and a lawyer is never quoted ₹0.
  const own =
    (channel && normalizeSlotPrice(read(slotKey(channel, slot.minutes)))) ||
    normalizeSlotPrice(read(slot.minutes));

  return own || slot.defaultPrice;
}

/**
 * Every slot with the price this lawyer charges for it on one channel.
 *
 * @param {object} advocate
 * @param {string} [channel] one of CONSULTATION_CHANNELS; omitted means the
 *   shared prices, which is what the pre-channel data holds.
 */
export function slotsFor(advocate, channel) {
  return CONSULTATION_SLOTS.map((slot) => ({
    ...slot,
    price: slotPrice(advocate, slot.minutes, channel),
  }));
}

/**
 * The per-minute rate a booked slot bills at.
 *
 * To the paisa, and rounded DOWN. At ₹500 for thirty minutes the true rate is
 * ₹16.666…; rounding to the nearest paisa gives ₹16.67, and thirty of those is
 * ₹500.10 — ten paise more than the price the client was quoted. Small, and
 * still a charge above the advertised one, which is not a thing a consultation
 * should ever do.
 *
 * Flooring leaves the full slot a few paise short of its price instead, and a
 * shortfall in the client's favour is the safe direction to be wrong in.
 *
 * @param {number} price    the slot's price in rupees
 * @param {number} minutes  the slot's length
 * @returns {number} rupees per minute, never more than price ÷ minutes
 */
export function rateFor(price, minutes) {
  const m = Number(minutes) || 0;
  if (m <= 0) return 0;
  return Math.floor((Number(price) / m) * 100) / 100;
}

/**
 * What a session on this slot actually costs for the minutes it ran.
 *
 * The slot's price is a hard ceiling regardless of the arithmetic above — the
 * quoted figure is a promise, and nothing computed from it may exceed it.
 *
 * @param {number} minutesRun
 * @param {number} price    the slot's price
 * @param {number} minutes  the slot's length
 * @returns {number} rupees
 */
export function chargeForSlot(minutesRun, price, minutes) {
  const ran = Math.max(0, Number(minutesRun) || 0);
  const amount = ran * rateFor(price, minutes);
  return Math.min(amount, Number(price) || 0);
}

/** The slot a booking names, or null if it is not one we offer. */
export function findSlot(minutes) {
  return CONSULTATION_SLOTS.find((s) => s.minutes === Number(minutes)) || null;
}
