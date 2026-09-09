'use client';

import { useEffect } from 'react';
import { X, Check, Crown, Sparkles, Loader2, Lock } from 'lucide-react';
import { useMembershipCheckout } from '@/hooks/useMembershipCheckout';
import { MEMBERSHIP_PLANS, annualTotal, GST_RATE } from '@/constants/membershipPlans';

/**
 * The plans, over the form the lawyer was already filling in.
 *
 * Not a page. A lawyer hits this because a chip would not tick — they are mid
 * thought, with unsaved changes on screen, and sending them to /dashboard/plan
 * means losing both. The modal keeps the form mounted underneath, and on a
 * successful payment the caller widens the limits in place: the chip that
 * refused a moment ago simply starts working.
 *
 * Only upgrades are shown. A plan smaller than the one they are on is not an
 * answer to "I need to add another practice area", and a downgrade belongs on
 * the plans page where its consequences can be explained properly.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {object} props.currentPlan   the plan they are on now
 * @param {string} [props.blocked]     what they were trying to add
 * @param {string} [props.suggest]     plan id that would fit it
 * @param {(result: object, planId: string) => void} props.onUpgraded
 */
const ICONS = { professional: Sparkles, premium: Crown };

export default function PlanUpgradeModal({
  open, onClose, currentPlan, blocked, suggest, onUpgraded,
}) {
  const { buy, busy, error } = useMembershipCheckout((result, planId) => {
    onUpgraded?.(result, planId);
  });

  // Escape closes it, and the page behind must not scroll while it is open —
  // a modal you can scroll past is a modal that looks broken.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onClose?.(); };
    document.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, busy, onClose]);

  if (!open) return null;

  const upgrades = MEMBERSHIP_PLANS.filter(
    (p) => p.monthly > 0 && p.rank > (currentPlan?.rank ?? -1)
  );

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-ink/45 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Upgrade your plan"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onClose?.(); }}
    >
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-2xl bg-surface shadow-2xl sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-start gap-3 border-b border-ink/8 bg-surface/95 px-5 py-4 backdrop-blur-md sm:px-6">
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700">
            <Lock className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-semibold leading-tight text-ink">
              {blocked ? `“${blocked}” needs a bigger plan` : 'Upgrade your plan'}
            </h2>
            <p className="mt-0.5 text-[12.5px] leading-snug text-ink/55">
              You are on {currentPlan?.name}. Pay here and the limit lifts on this
              page — you will not lose what you have filled in.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(busy)}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink/45 transition-colors hover:bg-ink/5 hover:text-ink disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-5 sm:px-6">
          {error && (
            <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13px] font-medium text-rose-700">
              {error}
            </p>
          )}

          {upgrades.length === 0 ? (
            <p className="rounded-xl bg-ink/[0.03] px-4 py-6 text-center text-sm text-ink/55">
              You are already on our largest plan. Remove something first to add
              this one.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {upgrades.map((plan) => {
                const Icon = ICONS[plan.id] || Sparkles;
                const price = annualTotal(plan.id);
                const best = plan.id === suggest;

                return (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col rounded-2xl border p-5 ${
                      best ? 'border-primary/40 bg-primary/[0.03] ring-1 ring-primary/15' : 'border-ink/10'
                    }`}
                  >
                    {best && (
                      <span className="absolute -top-2.5 left-5 rounded-full bg-primary px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-white">
                        Covers what you need
                      </span>
                    )}

                    <div className="flex items-center gap-2.5">
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/8 text-primary">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <p className="font-display text-lg font-bold text-ink">{plan.name}</p>
                    </div>

                    <div className="mt-3">
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
                    </div>

                    <ul className="mt-4 flex-1 space-y-1.5 border-t border-ink/8 pt-4">
                      <li className="text-[13px] font-semibold text-ink">
                        {plan.areas === null ? 'Unlimited' : plan.areas} practice areas
                      </li>
                      <li className="text-[13px] font-semibold text-ink">
                        {plan.matters === null ? 'Unlimited' : plan.matters} matters
                      </li>
                      <li className="text-[13px] font-semibold text-ink">
                        {plan.cities === null ? 'Unlimited' : plan.cities} practice cities
                      </li>
                      <li className="flex gap-1.5 pt-1 text-[12.5px] text-ink/55">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                        {plan.placement}
                      </li>
                    </ul>

                    <button
                      type="button"
                      onClick={() => buy(plan.id)}
                      disabled={Boolean(busy)}
                      className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors disabled:opacity-60 ${
                        best
                          ? 'bg-primary text-white hover:bg-primary-dark'
                          : 'border border-ink/15 text-ink/80 hover:border-primary/40 hover:text-primary'
                      }`}
                    >
                      {busy === plan.id && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                      {busy === plan.id ? 'Opening payment…' : `Upgrade to ${plan.name}`}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <p className="mt-4 text-center text-[11.5px] leading-relaxed text-ink/40">
            Prices include {Math.round(GST_RATE * 100)}% GST as shown. A plan runs
            twelve months and does not renew on its own. Consultations, rates and
            earnings are the same on every plan.
          </p>
        </div>
      </div>
    </div>
  );
}
