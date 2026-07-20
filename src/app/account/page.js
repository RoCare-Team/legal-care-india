import { redirect } from 'next/navigation';
import { createMetadata } from '@/lib/metadata';
import AccountView from '@/components/account/AccountView';
import { getSession, getSessionUserId } from '@/lib/auth';
import ExitImpersonation from '@/components/admin/ExitImpersonation';
import { getUserById } from '@/lib/users';
import { getUserConsultations } from '@/lib/consultations';

export const metadata = createMetadata({
  title: 'My Account',
  description: 'Manage your Legal Care India account.',
  path: '/account',
});

export default async function AccountPage() {
  const id = await getSessionUserId();
  if (!id) redirect('/user/login');

  const user = await getUserById(id);
  if (!user) redirect('/user/login');

  const allConsultations = await getUserConsultations(id);
  // Rows the user cleared from their own list (the advocate still sees theirs).
  const consultations = allConsultations.filter((c) => !c.hidden);

  const session = await getSession();

  return (
    <>
      {session?.impersonated && (
        <div className="border-b border-ink/8 bg-surface">
          <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6">
            <ExitImpersonation role="user" className="-ml-3" />
          </div>
        </div>
      )}
      <AccountView user={user} consultations={consultations} />
    </>
  );
}
