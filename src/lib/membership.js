import { revalidateTag } from 'next/cache';
import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';
import { ADVOCATES_TAG } from '@/lib/advocates';
import { annualTotal, getPlan, TERM_MONTHS, activePlan } from '@/constants/membershipPlans';

/**
 * Turning a captured payment into a membership.
 *
 * Lives here rather than in the route because two different things have to be
 * able to do it: the browser coming back from checkout, and Razorpay's webhook
 * when that browser never comes back. Both must produce exactly one membership
 * for one payment, so the decision of whether a payment has already been
 * applied has to be made in one place.
 *
 * This function does not authenticate anything. Its callers do — the route by
 * checking a signature and the session, the webhook by checking the webhook
 * signature — and it is their job not to call it for a payment they have not
 * proved. What it does check is that the payment is for the amount the plan
 * actually costs, because that is the one thing neither caller can see.
 *
 * @param {object} args
 * @param {string} args.advocateId    from the order's notes, never a request body
 * @param {string} args.planId        likewise
 * @param {string} args.paymentId     Razorpay payment id — the idempotency key
 * @param {string} [args.orderId]
 * @param {number} args.amountPaise   what Razorpay says was paid
 * @returns {Promise<{ok: boolean, error?: string, status?: number,
 *   applied?: boolean, planId?: string, planName?: string, expiresAt?: Date,
 *   price?: object}>}
 */
export async function grantMembership({
  advocateId,
  planId,
  paymentId,
  orderId = '',
  amountPaise,
}) {
  const plan = getPlan(planId);
  // getPlan falls back to Starter for anything it does not know, so an id that
  // does not come back as itself was never a real plan.
  if (plan.id !== planId || plan.monthly === 0) {
    return { ok: false, status: 400, error: 'Unknown plan on this payment.' };
  }

  const price = annualTotal(planId);
  const paid = Math.round(Number(amountPaise) / 100);
  if (paid !== price.total) {
    console.warn('membership: amount mismatch', { orderId, paid, expected: price.total });
    return { ok: false, status: 400, error: 'Payment amount does not match the plan.' };
  }

  await connectDB();
  const advocate = await Advocate.findById(advocateId).select(
    'planId planExpiresAt planPayments'
  );
  if (!advocate) return { ok: false, status: 404, error: 'Account not found.' };

  // The same payment reported twice — once by the browser callback and again
  // by the webhook — must extend the membership once. The Razorpay payment id
  // is what makes that decidable, and whichever arrives first wins.
  if (advocate.planPayments.some((p) => p.razorpayPaymentId === paymentId)) {
    return {
      ok: true,
      applied: false,
      planId: advocate.planId,
      planName: getPlan(advocate.planId).name,
      expiresAt: advocate.planExpiresAt,
      price,
    };
  }

  // A year from today, or a year from the current expiry when the lawyer is
  // renewing the same plan early — paying before you lapse should add to what
  // you have, not throw the remainder away. Switching plans starts fresh,
  // because the remainder was bought at a different price.
  const now = Date.now();
  const current = activePlan(advocate);
  const base =
    current.id === planId && advocate.planExpiresAt
      ? Math.max(new Date(advocate.planExpiresAt).getTime(), now)
      : now;

  const expiresAt = new Date(base);
  expiresAt.setMonth(expiresAt.getMonth() + TERM_MONTHS);

  advocate.planId = planId;
  advocate.planExpiresAt = expiresAt;
  advocate.planPayments.push({
    planId,
    months: TERM_MONTHS,
    base: price.base,
    gst: price.gst,
    total: price.total,
    razorpayOrderId: orderId,
    razorpayPaymentId: paymentId,
    startedAt: new Date(),
    expiresAt,
  });
  await advocate.save();

  // The plan changes where this lawyer sits in every listing, so the cached
  // directory has to be dropped or they keep their old placement for an hour.
  revalidateTag(ADVOCATES_TAG);

  return { ok: true, applied: true, planId, planName: plan.name, expiresAt, price };
}
