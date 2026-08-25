import { connectDB } from '@/lib/db';
import Counter from '@/models/Counter';

/**
 * Justiceland ID — the permanent public identifier for every lawyer.
 *
 * Sequential and human-sized: JUSLD01, JUSLD02, … JUSLD99, JUSLD100. Short
 * enough to read out on a phone call, and it says plainly how many lawyers
 * came before. Two digits is only the minimum width — the number is never
 * truncated, so the scheme keeps working past ninety-nine.
 *
 * Allocation is a single atomic `$inc` on a counter document. A read-then-
 * write would hand the same number to two people registering in the same
 * second, and the ID is in the profile URL, so a duplicate is not a cosmetic
 * problem — it is two lawyers fighting over one page.
 */
const PREFIX = 'JUSLD';
const SEQUENCE = 'legalCareId';
const MIN_DIGITS = 2;

/** Format a sequence number the way it appears everywhere: JUSLD01. */
export function formatLegalCareId(n) {
  return `${PREFIX}${String(n).padStart(MIN_DIGITS, '0')}`;
}

/**
 * Claim the next unused Justiceland ID. Never returns the same value twice,
 * even under simultaneous registrations.
 */
export async function nextLegalCareId() {
  await connectDB();
  const doc = await Counter.findOneAndUpdate(
    { _id: SEQUENCE },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
  return formatLegalCareId(doc.seq);
}

/**
 * The old, randomly generated format — `LCI-8KQ9PM`. Nothing issues these any
 * more, but profiles registered before the switch still carry theirs in
 * `legacyLegalCareId` so their indexed URLs keep resolving.
 */
export const LEGACY_PATTERN = /^LCI-[0-9A-Z]{6}$/;

/** True for an id in the current JUSLD form. */
export function isLegalCareId(value) {
  return new RegExp(`^${PREFIX}\\d+$`).test(String(value || '').toUpperCase());
}
