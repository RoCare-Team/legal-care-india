import { BadgeCheck } from 'lucide-react';
import { activePlan } from '@/constants/membershipPlans';

/**
 * PlanTierBadge — the badge a paid membership buys, shown wherever a lawyer is
 * shown publicly: their profile and the directory cards.
 *
 * One blue "Verified" tick for any active paid plan, the same for every tier —
 * the plan's name (Silver / Gold) is not shown to clients. Starter shows
 * nothing, and a lapsed paid plan is read as Starter by `activePlan`, so the
 * badge disappears the same day the placement and the query credits do.
 *
 * @param {object} props
 * @param {string} [props.planId]
 * @param {string|Date|null} [props.planExpiresAt]
 * @param {string} [props.className]
 */
export default function PlanTierBadge({ planId, planExpiresAt, className = '' }) {
  const plan = activePlan({ planId, planExpiresAt });
  if (plan.id === 'free') return null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-200 ${className}`}
    >
      <BadgeCheck className="h-3.5 w-3.5 fill-sky-500 text-white" aria-hidden="true" />
      Verified
    </span>
  );
}
