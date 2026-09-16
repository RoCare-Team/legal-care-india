import { NextResponse } from 'next/server';
import { getSessionAdvocateId } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Advocate from '@/models/Advocate';
import { MEMBERSHIP_PLANS, annualTotal, activePlan } from '@/constants/membershipPlans';
import { summarizeCredits } from '@/lib/queryCredits';

export const dynamic = 'force-dynamic';

/**
 * GET /api/membership/plans
 *   → { plans: [...], current: {...} | null }
 *
 * The plan table as JSON, for the mobile app — the website renders it straight
 * from constants/membershipPlans, and the app reads the same table here rather
 * than keeping a copy that could drift on price or credits.
 *
 * `price` is what a year actually costs (base + GST = total), the same figure
 * /api/membership/order opens the Razorpay order for. `current` is filled in
 * for a signed-in lawyer: their plan, its expiry and this month's credits.
 */
export async function GET() {
  const plans = MEMBERSHIP_PLANS.map((p) => ({
    id: p.id,
    name: p.name,
    tagline: p.tagline,
    monthly: p.monthly,
    queryCredits: p.queryCredits || 0,
    areas: p.areas,
    matters: p.matters,
    cities: p.cities,
    placement: p.placement,
    features: p.features,
    price: annualTotal(p.id),
  }));

  let current = null;
  const advocateId = await getSessionAdvocateId();
  if (advocateId) {
    try {
      await connectDB();
      const adv = await Advocate.findById(advocateId)
        .select('planId planExpiresAt queryCreditCycle queryCreditsUsed')
        .lean();
      if (adv) {
        const plan = activePlan(adv);
        current = {
          planId: plan.id,
          planName: plan.name,
          expiresAt: plan.id !== 'free' && adv.planExpiresAt ? new Date(adv.planExpiresAt).toISOString() : null,
          credits: summarizeCredits(adv),
        };
      }
    } catch (err) {
      console.error('membership plans: could not read current plan', err);
    }
  }

  return NextResponse.json({ plans, current });
}
