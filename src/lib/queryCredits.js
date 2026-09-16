import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';
import { activePlan } from '@/constants/membershipPlans';

/**
 * Client query credits — what a paid plan spends to take a query.
 *
 * Each plan carries a monthly allowance (`queryCredits` in membershipPlans):
 * Professional 10, Premium 25, Starter none. One credit takes one query.
 * Unused credits do not carry into the next month.
 *
 * The month is counted back from the plan's expiry, not from the calendar. A
 * plan bought on the 17th renews its credits on the 17th, and renewing early —
 * which pushes the expiry out by exactly twelve months — lands on the same day
 * and so cannot be used to reset a spent month. Switching plan sets a new
 * expiry and therefore a new cycle, with the new plan's full allowance.
 *
 * Nothing is reset on a schedule. The lawyer's record holds the cycle its count
 * belongs to; a count from an older cycle is simply read as zero, and the next
 * spend overwrites it. Every change is a conditional update, so two claims at
 * the same moment cannot both spend the last credit.
 */

function httpError(message, status, code) {
  const e = new Error(message);
  e.status = status;
  e.code = code;
  return e;
}

/** `date` moved by whole calendar months, in UTC. */
function addMonths(date, months) {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

/**
 * The plan's current monthly cycle.
 *
 * @param {{planId?: string, planExpiresAt?: Date|string|null}} advocate
 * @param {Date} [now]
 * @returns {{plan: object, allowance: number, key: string, startsAt: Date|null, resetsAt: Date|null}}
 */
export function creditCycle(advocate, now = new Date()) {
  const plan = activePlan(advocate);
  const allowance = plan.queryCredits || 0;
  if (!allowance || !advocate?.planExpiresAt) {
    return { plan, allowance: 0, key: '', startsAt: null, resetsAt: null };
  }

  const expiry = new Date(advocate.planExpiresAt);
  // The latest month boundary, counting back from expiry, that has passed.
  // Bounded well past any real term so a corrupt date cannot spin forever.
  for (let k = 1; k <= 240; k++) {
    const startsAt = addMonths(expiry, -k);
    if (startsAt.getTime() <= now.getTime()) {
      const resetsAt = addMonths(expiry, -(k - 1));
      return { plan, allowance, key: startsAt.toISOString(), startsAt, resetsAt };
    }
  }
  return { plan, allowance: 0, key: '', startsAt: null, resetsAt: null };
}

/**
 * What the lawyer has this month, in the shape the portal shows.
 *
 * @param {object} advocate  needs planId, planExpiresAt, queryCreditCycle, queryCreditsUsed
 */
export function summarizeCredits(advocate, now = new Date()) {
  const cycle = creditCycle(advocate, now);
  const used = cycle.key && advocate?.queryCreditCycle === cycle.key ? advocate.queryCreditsUsed || 0 : 0;
  return {
    hasPlan: cycle.allowance > 0,
    planId: cycle.plan.id,
    planName: cycle.plan.name,
    allowance: cycle.allowance,
    used: Math.min(used, cycle.allowance),
    left: Math.max(0, cycle.allowance - used),
    resetsAt: cycle.resetsAt,
  };
}

/** Reads the lawyer's credits from the database. */
export async function getQueryCredits(advocateId) {
  await connectDB();
  const advocate = await Advocate.findById(advocateId)
    .select('planId planExpiresAt queryCreditCycle queryCreditsUsed')
    .lean();
  return summarizeCredits(advocate || {});
}

/**
 * Spends one credit, or refuses.
 *
 * @returns {Promise<{cycle: string}>} the cycle it was spent in, for a refund
 * @throws 402 `no_plan` when the plan has no query credits,
 *         402 `no_credits` when this month's are used up
 */
export async function spendQueryCredit(advocateId) {
  await connectDB();
  const advocate = await Advocate.findById(advocateId)
    .select('planId planExpiresAt')
    .lean();
  if (!advocate) throw httpError('Account not found.', 404, 'not_found');

  const cycle = creditCycle(advocate);
  if (!cycle.allowance) {
    throw httpError(
      'Client queries come with the Professional and Premium plans. Upgrade to take this query.',
      402,
      'no_plan'
    );
  }

  // First spend of a new cycle: the stored count belongs to an older one, so
  // it is replaced rather than added to. Only one concurrent request can win
  // this, because once it has written the new cycle the filter no longer holds.
  const fresh = await Advocate.updateOne(
    { _id: advocateId, queryCreditCycle: { $ne: cycle.key } },
    { $set: { queryCreditCycle: cycle.key, queryCreditsUsed: 1 } }
  );
  if (fresh.modifiedCount === 1) return { cycle: cycle.key };

  // Same cycle: take one only while some are left.
  const spent = await Advocate.updateOne(
    { _id: advocateId, queryCreditCycle: cycle.key, queryCreditsUsed: { $lt: cycle.allowance } },
    { $inc: { queryCreditsUsed: 1 } }
  );
  if (spent.modifiedCount === 1) return { cycle: cycle.key };

  const resets = cycle.resetsAt
    ? cycle.resetsAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })
    : '';
  throw httpError(
    `You have used all ${cycle.allowance} query credits for this month.${resets ? ` They renew on ${resets}.` : ''}`,
    402,
    'no_credits'
  );
}

/**
 * Gives back a credit that bought nothing — the query was taken by someone
 * else between the lawyer pressing and the claim landing. Only within the
 * cycle it was spent in: a credit from a month that has ended is gone anyway.
 */
export async function refundQueryCredit(advocateId, cycleKey) {
  if (!cycleKey) return;
  await Advocate.updateOne(
    { _id: advocateId, queryCreditCycle: cycleKey, queryCreditsUsed: { $gt: 0 } },
    { $inc: { queryCreditsUsed: -1 } }
  );
}
