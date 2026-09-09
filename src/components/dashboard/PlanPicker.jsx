'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Loader2, Crown, ShieldCheck, Sparkles } from 'lucide-react';
import { useMembershipCheckout } from '@/hooks/useMembershipCheckout';
import {
  MEMBERSHIP_PLANS,
  annualTotal,
  activePlan,
  getPlan,
  GST_RATE,
} from '@/constants/membershipPlans';

/**
 * The three plans, and the way to buy one.
 *
 * Prices are quoted per month and charged for a year, so both figures are on
 * every card — a lawyer who sees "₹199/month" and is then asked for ₹2,820 at
 * checkout has been surprised by their own purchase. The tax is broken out for
 * the same reason.
 *
 * Nothing here decides what a plan costs or what it allows; both come from
 * constants/membershipPlans, which is also what the server enforces on save.
 * A price shown on this page cannot drift from the one that is charged.
 *
 * @param {object} props
 * @param {object} props.advocate  needs planId, planExpiresAt, and the current
 *   specializations/subSpecializations so a downgrade can be refused honestly
 */
const ICONS = { free: ShieldCheck, professional: Sparkles, premium: Crown };

export default function PlanPicker({ advocate }) {
  const router = useRouter();
  const params = useSearchParams();
  // The plan just paid for, so the page can confirm it even when there is no
  // section to return to — a purchase that changes nothing on screen reads as
  // a purchase that did not happen.
  const [bought, setBought] = useState('');

  // One implementation of order → checkout → verify, shared with the modal
  // that sells the same plans from inside the profile form.
  const { buy, busy, error } = useMembershipCheckout((result, planId) => {
    setBought(planId);

    // Straight back to the section they were filling in, with the new
    // allowance already applied — not to a dashboard where they have to find
    // their place again. The flag is what tells that page to say what just
    // became possible, rather than silently widening a limit and leaving the
    // lawyer to discover it by trying again.
    if (returnTo) {
      const sep = returnTo.includes('?') ? '&' : '?';
      const [path, hash = ''] = returnTo.split('#');
      router.push(`${path}${sep}upgraded=${planId}${hash ? `#${hash}` : ''}`);
    }
    // Either way the server data behind this page is now a plan out of date —
    // refreshed so "Your current plan" moves to the plan actually bought.
    router.refresh();
  });

  // Where the lawyer was when they ran out of allowance. Only a same-site
  // path is honoured — a `returnTo` pointing at another origin would turn this
  // page into an open redirect for anyone who could get a lawyer to click it.
  const raw = params.get('returnTo') || '';
  const returnTo = raw.startsWith('/') && !raw.startsWith('//') ? raw : '';

  const current = activePlan(advocate);
  const areasUsed = (advocate?.specializations || []).length;
  const mattersUsed = (advocate?.subSpecializations || []).length;

  const expires = advocate?.planExpiresAt ? new Date(advocate.planExpiresAt) : null;
  const expiryLabel =
    expires && expires.getTime() > Date.now()
      ? expires.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
      : null;

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-display text-xl font-bold text-ink">Your plan</h2>
        <p className="mt-1 text-sm text-ink/60">
          You are on <span className="font-semibold text-ink">{current.name}</span>
          {expiryLabel && current.monthly > 0 ? ` until ${expiryLabel}` : ''}. Using{' '}
          <span className="font-semibold text-ink">{areasUsed}</span>
          {current.areas === null ? '' : ` of ${current.areas}`} practice areas and{' '}
          <span className="font-semibold text-ink">{mattersUsed}</span>
          {current.matters === null ? '' : ` of ${current.matters}`} matters.
        </p>
      </div>

      {bought && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3">
          <p className="text-[13.5px] font-semibold text-emerald-900">
            You are on {getPlan(bought).name} now.
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-emerald-900/85">
            You can add{' '}
            {getPlan(bought).areas === null
              ? 'as many practice areas, matters and cities as you handle'
              : `up to ${getPlan(bought).areas} practice areas, ${getPlan(bought).matters} matters and ${getPlan(bought).cities} cities`}
            .
          </p>
        </div>
      )}

      {returnTo && !bought && (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-amber-900">
          You have used everything your {current.name} plan covers. Pick a plan
          below and you will be taken straight back to finish what you were
          adding.
        </p>
      )}

      {error && (
        <p className="mb-4 rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {MEMBERSHIP_PLANS.map((plan) => {
          const Icon = ICONS[plan.id] || ShieldCheck;
          const price = annualTotal(plan.id);
          const isCurrent = plan.id === current.id;
          const isDowngrade = plan.rank < current.rank;
          // A plan smaller than what the lawyer has already listed would put
          // them over its own limits the moment it started, so it is not
          // offered — with the reason said out loud rather than a dead button.
          const wouldNotFit =
            (plan.areas !== null && areasUsed > plan.areas) ||
            (plan.matters !== null && mattersUsed > plan.matters);

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border bg-surface p-5 ${
                isCurrent
                  ? 'border-primary/40 ring-1 ring-primary/20'
                  : 'border-ink/10'
              }`}
            >
              {plan.id === 'premium' && (
                <span className="absolute -top-2.5 right-4 rounded-full bg-[#D4AF37] px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-[#0F172A]">
                  Best placement
                </span>
              )}

              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/8 text-primary">
                  <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <p className="font-display text-lg font-bold text-ink">{plan.name}</p>
              </div>

              <p className="mt-2 text-[13px] leading-relaxed text-ink/55">{plan.tagline}</p>

              <div className="mt-4">
                {plan.monthly === 0 ? (
                  <p className="font-display text-2xl font-bold text-ink">Free</p>
                ) : (
                  <>
                    <p className="font-display text-2xl font-bold text-ink">
                      ₹{plan.monthly}
                      <span className="text-sm font-medium text-ink/50">/month</span>
                    </p>
                    <p className="mt-0.5 text-[12px] text-ink/45">
                      Billed yearly — ₹{price.base.toLocaleString('en-IN')} + ₹
                      {price.gst.toLocaleString('en-IN')} GST ={' '}
                      <span className="font-semibold text-ink/70">
                        ₹{price.total.toLocaleString('en-IN')}
                      </span>
                    </p>
                  </>
                )}
              </div>

              <div className="mt-4 space-y-1.5 border-t border-ink/8 pt-4 text-[13px]">
                <p className="font-semibold text-ink">
                  {plan.areas === null ? 'Unlimited' : plan.areas} practice areas
                </p>
                <p className="font-semibold text-ink">
                  {plan.matters === null ? 'Unlimited' : plan.matters} matters
                </p>
                <p className="text-ink/55">{plan.placement}</p>
              </div>

              <ul className="mt-4 flex-1 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2 text-[13px] text-ink/70">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-5">
                {isCurrent ? (
                  <p className="rounded-xl bg-primary/8 py-2.5 text-center text-sm font-semibold text-primary">
                    Your current plan
                  </p>
                ) : plan.monthly === 0 ? (
                  <p className="py-2.5 text-center text-[12.5px] leading-relaxed text-ink/45">
                    You return to Starter when your plan ends.
                  </p>
                ) : wouldNotFit ? (
                  <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-center text-[12.5px] leading-relaxed text-amber-800">
                    You have listed more than this plan allows. Remove some first.
                  </p>
                ) : (
                  <button
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => buy(plan.id)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
                  >
                    {busy === plan.id && (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    )}
                    {isDowngrade ? `Switch to ${plan.name}` : `Upgrade to ${plan.name}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-[12px] leading-relaxed text-ink/45">
        Prices include {Math.round(GST_RATE * 100)}% GST as shown. A plan runs for
        twelve months and does not renew on its own — you will be able to renew
        it from this page before it ends. Your consultations, rates and earnings
        are the same on every plan.
      </p>
    </div>
  );
}
