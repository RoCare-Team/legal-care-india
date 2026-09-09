import { redirect } from 'next/navigation';
import { getSessionAdvocateId } from '@/lib/auth';
import { getAdvocateById } from '@/lib/advocates';
import PlanPicker from '@/components/dashboard/PlanPicker';

export const metadata = { title: 'Your plan' };

/**
 * Where a lawyer sees what their membership covers and changes it.
 *
 * Deliberately its own page rather than a section of the profile editor: the
 * editor is where you describe your practice, and this is where you decide how
 * much of it you are allowed to describe. Bumping into a limit in the editor
 * sends you here.
 */
export default async function PlanPage() {
  const id = await getSessionAdvocateId();
  if (!id) redirect('/login?redirect=/dashboard/plan');

  const advocate = await getAdvocateById(id);
  if (!advocate) redirect('/login?redirect=/dashboard/plan');

  return (
    <PlanPicker
      advocate={{
        planId: advocate.planId || 'free',
        planExpiresAt: advocate.planExpiresAt || null,
        specializations: advocate.specializations || [],
        subSpecializations: advocate.subSpecializations || [],
      }}
    />
  );
}
