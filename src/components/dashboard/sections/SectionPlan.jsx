'use client';

import PlanPicker from '../PlanPicker';

/**
 * SectionPlan — the last step of the guided setup: the plans, exactly as they
 * are on /dashboard/plan, reusing that component rather than a second copy of
 * the pricing cards.
 *
 * Not part of the profile completion checklist (see ProfileSetupStepper's
 * synthetic `PLAN_STEP`) — Starter is a complete, valid choice on its own, so
 * there is nothing here to be "missing". This step exists so a lawyer sees
 * what a bigger plan covers at the one moment they can judge it: right after
 * describing their whole practice, and before the congratulations screen
 * rather than after it.
 *
 * Field names differ between the setup draft and what PlanPicker expects
 * (`services`/`subServices` vs. the record's own `specializations`/
 * `subSpecializations`) — adapted here rather than teaching PlanPicker a
 * second vocabulary.
 */
export default function SectionPlan({ data, set }) {
  return (
    <PlanPicker
      advocate={{
        planId: data.planId,
        planExpiresAt: data.planExpiresAt,
        specializations: data.services || [],
        subSpecializations: data.subServices || [],
      }}
      hideHeading
      onUpgraded={(result) => {
        set('planId', result.planId);
        set('planExpiresAt', result.expiresAt || null);
      }}
    />
  );
}
