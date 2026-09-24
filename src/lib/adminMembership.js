import mongoose from 'mongoose';
import { revalidateTag } from 'next/cache';
import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';
import { ADVOCATES_TAG } from '@/lib/advocates';
import { activePlan, getPlan, PAID_PLANS, FREE_PLAN_ID } from '@/constants/membershipPlans';
import { summarizeCredits } from '@/lib/queryCredits';

/**
 * Managing a lawyer's membership by hand, from the admin panel.
 *
 * Lawyers still buy plans themselves on the website (lib/membership). This is
 * the other door: a plan paid for offline, a complimentary month, a correction
 * after a failed checkout, or ending a plan early. Every change is written to
 * the same `planPayments` history as online purchases, marked `source: admin`
 * with who did it and why, so the lawyer's billing record stays one list.
 */

/** The longest a single hand-set term may run. */
const MAX_MONTHS = 36;

function httpError(message, status = 400) {
  const e = new Error(message);
  e.status = status;
  return e;
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

async function loadAdvocate(id) {
  if (!mongoose.isValidObjectId(id)) throw httpError('Lawyer not found.', 404);
  await connectDB();
  const adv = await Advocate.findById(id)
    .select('planId planExpiresAt queryCreditCycle queryCreditsUsed')
    .lean();
  if (!adv) throw httpError('Lawyer not found.', 404);
  return adv;
}

/**
 * The membership panel's data for one lawyer.
 *
 * @param {object} adv  the raw advocate record
 */
export function membershipSummary(adv) {
  const now = Date.now();
  const plan = activePlan(adv);
  const stored = getPlan(adv?.planId);
  const expiresAt = adv?.planExpiresAt ? new Date(adv.planExpiresAt) : null;
  const lapsed = stored.id !== FREE_PLAN_ID && plan.id === FREE_PLAN_ID;

  return {
    planId: plan.id,
    planName: plan.name,
    // The paid plan on record even when it has run out, so the panel can say
    // "Premium — expired on …" rather than just "Starter".
    storedPlanId: stored.id,
    storedPlanName: stored.name,
    lapsed,
    expiresAt: expiresAt ? expiresAt.toISOString() : null,
    daysLeft: expiresAt && !lapsed ? Math.max(0, Math.ceil((expiresAt.getTime() - now) / 86400000)) : 0,
    credits: summarizeCredits(adv || {}),
    history: (adv?.planPayments || [])
      .map((p, index) => ({
        index,
        id: String(p._id || ''),
        planId: p.planId,
        planName: getPlan(p.planId).name,
        source: p.source || 'razorpay',
        action: p.action || 'grant',
        months: p.months || 0,
        total: p.total || 0,
        gst: p.gst || 0,
        paymentId: p.razorpayPaymentId || '',
        grantedBy: p.grantedBy || '',
        note: p.note || '',
        startedAt: p.startedAt ? new Date(p.startedAt).toISOString() : null,
        expiresAt: p.expiresAt ? new Date(p.expiresAt).toISOString() : null,
      }))
      // Newest first by when it happened; entries written in the same instant
      // keep the order they were written in.
      .sort((a, b) => (new Date(b.startedAt || 0) - new Date(a.startedAt || 0)) || b.index - a.index),
  };
}

/**
 * Gives a lawyer a paid plan, or extends / changes the one they have.
 *
 * @param {string} id
 * @param {object} input
 * @param {string} input.planId       'professional' | 'premium'
 * @param {number} [input.months]     1–36; ignored when `endDate` is given
 * @param {string} [input.endDate]    'YYYY-MM-DD' — an exact expiry instead
 * @param {boolean} [input.extend]    add to the current expiry when the lawyer
 *                                    already has this plan active
 * @param {number} [input.amount]     rupees received offline, for the record
 * @param {string} [input.note]
 * @param {string} adminEmail
 */
export async function adminSetPlan(id, input, adminEmail = '') {
  const planId = String(input?.planId || '');
  if (!PAID_PLANS.some((p) => p.id === planId)) throw httpError('Choose Silver or Gold.');

  const adv = await loadAdvocate(id);
  const now = new Date();
  const current = activePlan(adv);

  let expiresAt;
  let months = 0;
  if (input?.endDate) {
    // End of that day in India, so "valid till 30 Sep" includes the 30th.
    expiresAt = new Date(`${String(input.endDate).slice(0, 10)}T23:59:59+05:30`);
    if (Number.isNaN(expiresAt.getTime())) throw httpError('Enter a valid end date.');
    if (expiresAt.getTime() <= now.getTime()) throw httpError('The end date must be in the future.');
    if (expiresAt.getTime() > addMonths(now, MAX_MONTHS).getTime()) {
      throw httpError(`A plan can be set for at most ${MAX_MONTHS} months at a time.`);
    }
    months = Math.max(1, Math.round((expiresAt.getTime() - now.getTime()) / (30.44 * 86400000)));
  } else {
    months = Math.round(Number(input?.months));
    if (!Number.isFinite(months) || months < 1 || months > MAX_MONTHS) {
      throw httpError(`Choose a duration between 1 and ${MAX_MONTHS} months.`);
    }
    // Extending only makes sense on the same, still-running plan; anything
    // else starts today, as an online purchase would.
    const base =
      input?.extend && current.id === planId && adv.planExpiresAt
        ? new Date(Math.max(new Date(adv.planExpiresAt).getTime(), now.getTime()))
        : now;
    expiresAt = addMonths(base, months);
  }

  const amount = Math.max(0, Math.round(Number(input?.amount) || 0));
  if (amount > 1000000) throw httpError('That amount looks wrong.');
  const note = String(input?.note || '').trim().slice(0, 300);

  await Advocate.updateOne(
    { _id: id },
    {
      $set: { planId, planExpiresAt: expiresAt },
      $push: {
        planPayments: {
          planId,
          months,
          base: amount,
          gst: 0,
          total: amount,
          razorpayOrderId: '',
          razorpayPaymentId: '',
          startedAt: now,
          expiresAt,
          source: 'admin',
          action: 'grant',
          grantedBy: adminEmail,
          note,
        },
      },
    }
  );
  revalidateTag(ADVOCATES_TAG);
  console.warn(`[admin] ${adminEmail || 'admin'} set plan ${planId} for ${id} until ${expiresAt.toISOString()}`);
  return { planId, planName: getPlan(planId).name, expiresAt };
}

/** Ends a lawyer's plan now; they drop to Starter immediately. */
export async function adminCancelPlan(id, note = '', adminEmail = '') {
  const adv = await loadAdvocate(id);
  if (activePlan(adv).id === FREE_PLAN_ID && (!adv.planId || adv.planId === FREE_PLAN_ID)) {
    throw httpError('This lawyer is already on Starter.');
  }
  const now = new Date();
  await Advocate.updateOne(
    { _id: id },
    {
      $set: { planId: FREE_PLAN_ID, planExpiresAt: null },
      $push: {
        planPayments: {
          planId: adv.planId || FREE_PLAN_ID,
          months: 0,
          base: 0,
          gst: 0,
          total: 0,
          startedAt: now,
          expiresAt: now,
          source: 'admin',
          action: 'cancel',
          grantedBy: adminEmail,
          note: String(note || '').trim().slice(0, 300),
        },
      },
    }
  );
  revalidateTag(ADVOCATES_TAG);
  console.warn(`[admin] ${adminEmail || 'admin'} cancelled the plan for ${id}`);
  return { planId: FREE_PLAN_ID };
}

/** Gives back every query credit spent this month. */
export async function adminResetQueryCredits(id, adminEmail = '') {
  const adv = await loadAdvocate(id);
  if (!summarizeCredits(adv).hasPlan) throw httpError('This lawyer has no plan with query credits.');
  await Advocate.updateOne({ _id: id }, { $set: { queryCreditsUsed: 0 } });
  console.warn(`[admin] ${adminEmail || 'admin'} reset query credits for ${id}`);
  return { ok: true };
}
