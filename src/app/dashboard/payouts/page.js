import { redirect } from 'next/navigation';
import { getSessionAdvocateId } from '@/lib/auth';
import { getLawyerPayoutData } from '@/lib/payouts';
import PayoutsWorkspace from '@/components/dashboard/payouts/PayoutsWorkspace';

export const metadata = {
  title: 'Payouts | Lawyer Portal',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function PayoutsPage() {
  const id = await getSessionAdvocateId();
  if (!id) redirect('/login');

  const data = await getLawyerPayoutData(id);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Payouts</h1>
        <p className="mt-1 text-sm text-ink/55">
          Your earnings after commission, withdrawals to your bank, and where they go.
        </p>
      </div>
      <PayoutsWorkspace data={JSON.parse(JSON.stringify(data))} />
    </div>
  );
}
