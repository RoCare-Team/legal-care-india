/**
 * What a lawyer's membership buys them.
 *
 * Two things, and they are the only two: how much of their practice they may
 * list, and where they sit in a search. Nothing here touches consultations —
 * a lawyer on the free plan takes chats, calls and video on exactly the same
 * terms as one paying ₹499, sets the same slot prices and is paid the same
 * way. This is about being found, not about being paid.
 *
 * The single source for both the paywall and the ranking, so a limit shown in
 * the pricing table is the same number the server enforces on save.
 */

/** 18% on a service, which is what a listing is. */
export const GST_RATE = 0.18;

/** Every plan runs a year at a time. See `annualTotal` for what that costs. */
export const TERM_MONTHS = 12;

/**
 * The ladder, cheapest first. `rank` orders lawyers in search — higher wins —
 * and is deliberately separate from the price so the two can move apart.
 *
 * `areas`, `matters` and `cities` are ceilings on `specializations`,
 * `subSpecializations` and `practiceCities`. `null` means no ceiling.
 */
export const MEMBERSHIP_PLANS = [
  {
    id: 'free',
    name: 'Starter',
    tagline: 'Get listed and start taking consultations.',
    monthly: 0,
    rank: 0,
    areas: 2,
    matters: 4,
    cities: 2,
    // Said as a fact about the ordering, not as a promise about a position.
    placement: 'Listed in search results',
    features: [
      'Public profile in the directory',
      'Chat, audio and video consultations',
      'Your own slot prices, or our standard ones',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    tagline: 'For a practice that spans more than a couple of matters.',
    monthly: 199,
    rank: 1,
    areas: 5,
    matters: 10,
    cities: 5,
    placement: 'Ranked above Starter lawyers in every search',
    features: [
      'Everything in Starter',
      '5 practice areas, 10 matters and 5 cities',
      'Ranked above free listings',
      'Professional badge on your profile',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    tagline: 'Every matter you handle, at the top of the page.',
    monthly: 499,
    rank: 2,
    areas: null,
    matters: null,
    cities: null,
    placement: 'Top of every search, above all other lawyers',
    features: [
      'Everything in Professional',
      'Unlimited practice areas, matters and cities',
      'Top placement in search results',
      'Premium badge on your profile',
    ],
  },
];

/** The plan a lawyer has when they have never paid for one. */
export const FREE_PLAN_ID = 'free';

/** Lookup by id, falling back to Starter for an unknown or missing value. */
export function getPlan(id) {
  return (
    MEMBERSHIP_PLANS.find((p) => p.id === id) ||
    MEMBERSHIP_PLANS.find((p) => p.id === FREE_PLAN_ID)
  );
}

/** Only the plans somebody can actually buy. */
export const PAID_PLANS = MEMBERSHIP_PLANS.filter((p) => p.monthly > 0);

/**
 * What a year of a plan costs, to the rupee.
 *
 * Priced by the month and billed by the year, so the figure a lawyer is asked
 * to pay is twelve of them plus GST — and every part of that is returned
 * separately, because an invoice has to show the tax it charged.
 *
 * @param {string} planId
 * @returns {{base: number, gst: number, total: number, monthly: number}}
 *   Rupees, not paise. Razorpay wants paise; that conversion belongs at the
 *   point of payment, not here.
 */
export function annualTotal(planId) {
  const plan = getPlan(planId);

  // A flat test price, when one is set. Razorpay will not take a real card
  // for a rupee in live mode, so this exists to walk the whole flow — order,
  // checkout, verify, membership granted — without ₹2,818 moving each time.
  //
  // It has to live here rather than in the order route because two places
  // read the price and they must agree: the order is opened for it and
  // grantMembership refuses a payment whose amount is not exactly it.
  //
  // NEXT_PUBLIC_ on purpose. Without it the pricing page (client) would quote
  // ₹2,818 while checkout (server) asked for ₹1, which looks like a bug and
  // is worse than the test price being visible.
  const testAmount = Number(process.env.NEXT_PUBLIC_MEMBERSHIP_TEST_AMOUNT);
  if (Number.isFinite(testAmount) && testAmount > 0) {
    return { base: testAmount, gst: 0, total: testAmount, monthly: plan.monthly };
  }

  const base = plan.monthly * TERM_MONTHS;
  // Rounded to whole rupees so the total never carries a stray paisa that the
  // receipt and the payment gateway then disagree about.
  const gst = Math.round(base * GST_RATE);
  return { base, gst, total: base + gst, monthly: plan.monthly };
}

/**
 * The plan a lawyer is actually on right now.
 *
 * A membership that has run out is not the plan they bought — it is Starter,
 * with their old limits gone. Reading it this way rather than expiring rows on
 * a schedule means there is no window where an unpaid listing keeps premium
 * placement because a cron job has not run yet.
 *
 * @param {{planId?: string, planExpiresAt?: Date|string|null}} advocate
 * @returns {object} the plan, never null
 */
export function activePlan(advocate) {
  const id = advocate?.planId;
  if (!id || id === FREE_PLAN_ID) return getPlan(FREE_PLAN_ID);

  const expiry = advocate?.planExpiresAt ? new Date(advocate.planExpiresAt) : null;
  if (!expiry || Number.isNaN(expiry.getTime()) || expiry.getTime() <= Date.now()) {
    return getPlan(FREE_PLAN_ID);
  }
  return getPlan(id);
}

/**
 * Whether a selection fits inside a plan, and what to say when it does not.
 *
 * Returns the same shape whether it passes or fails so the caller can render
 * one message rather than branching on two.
 *
 * @param {object} plan
 * @param {{areas?: string[], matters?: string[], cities?: string[]}} selection
 * @returns {{ok: boolean, error: string, upgradeTo: string|null}}
 */
export function checkPlanLimits(plan, { areas = [], matters = [], cities = [] } = {}) {
  const over = (limit, chosen) => limit !== null && chosen > limit;
  const counts = { areas: areas.length, matters: matters.length, cities: cities.length };

  if (over(plan.areas, areas.length)) {
    return {
      ok: false,
      error:
        `Your ${plan.name} plan covers ${plan.areas} practice ` +
        `${plan.areas === 1 ? 'area' : 'areas'}. You have selected ${areas.length}.`,
      upgradeTo: nextPlanFor(plan, counts),
    };
  }

  if (over(plan.matters, matters.length)) {
    return {
      ok: false,
      error:
        `Your ${plan.name} plan covers ${plan.matters} ` +
        `${plan.matters === 1 ? 'matter' : 'matters'}. You have selected ${matters.length}.`,
      upgradeTo: nextPlanFor(plan, counts),
    };
  }

  if (over(plan.cities, cities.length)) {
    return {
      ok: false,
      error:
        `Your ${plan.name} plan covers ${plan.cities} practice ` +
        `${plan.cities === 1 ? 'city' : 'cities'}. You have selected ${cities.length}.`,
      upgradeTo: nextPlanFor(plan, counts),
    };
  }

  return { ok: true, error: '', upgradeTo: null };
}

/**
 * The cheapest plan that would actually hold this selection.
 *
 * Naming it is the difference between "upgrade" and "upgrade to Professional,
 * which covers what you have chosen" — and it avoids sending someone to a plan
 * that still would not fit them.
 *
 * @returns {string|null} a plan id, or null if even the top plan cannot hold it
 */
export function nextPlanFor(current, { areas = 0, matters = 0, cities = 0 } = {}) {
  const fits = (plan) =>
    (plan.areas === null || areas <= plan.areas) &&
    (plan.matters === null || matters <= plan.matters) &&
    (plan.cities === null || cities <= plan.cities);

  const better = MEMBERSHIP_PLANS.filter((p) => p.rank > (current?.rank ?? -1) && fits(p));
  return better.length ? better[0].id : null;
}
