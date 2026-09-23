import { Sparkles, Crown } from 'lucide-react';
import { activePlan } from '@/constants/membershipPlans';

/**
 * PlanTierBadge — the "Professional badge" / "Premium badge" every paid
 * plan's feature list already promises (see constants/membershipPlans), shown
 * wherever a lawyer is shown publicly: their profile and the directory cards.
 *
 * Silver for Professional, gold for Premium — the same ladder the plans
 * themselves are sold on, so a client sees the same ranking here that the
 * pricing table describes. Starter shows nothing: a badge for the plan
 * everyone starts on would not be a badge, and a lapsed paid plan is read as
 * Starter by `activePlan` — the badge disappears the same day the placement
 * and the query credits do, never advertising a plan that has actually
 * expired.
 *
 * @param {object} props
 * @param {string} [props.planId]
 * @param {string|Date|null} [props.planExpiresAt]
 * @param {string} [props.className]
 */
export default function PlanTierBadge({ planId, planExpiresAt, className = '' }) {
  const plan = activePlan({ planId, planExpiresAt });
  if (plan.id === 'free') return null;

  const premium = plan.id === 'premium';
  const Icon = premium ? Crown : Sparkles;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
        premium
          ? 'bg-gradient-to-r from-[#F5E7B8] to-[#D4AF37]/25 text-[#8A6D1E] ring-[#D4AF37]/40'
          : 'bg-gradient-to-r from-slate-100 to-slate-200/70 text-slate-600 ring-slate-300/70'
      } ${className}`}
    >
      <Icon className={`h-3.5 w-3.5 ${premium ? 'text-[#B8901F]' : 'text-slate-500'}`} aria-hidden="true" />
      {plan.name}
    </span>
  );
}
