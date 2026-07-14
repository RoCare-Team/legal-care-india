import { redirect } from 'next/navigation';
import { createMetadata } from '@/lib/metadata';
import AccountView from '@/components/account/AccountView';
import { getSessionUserId } from '@/lib/auth';
import { getUserById } from '@/lib/users';
import { getUserActivity } from '@/lib/activity';
import { getEnquiriesForUser } from '@/lib/enquiries';
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

  const [activity, enquiries, consultations] = await Promise.all([
    getUserActivity(id),
    getEnquiriesForUser(id),
    getUserConsultations(id),
  ]);

  // Latest booking status per advocate (enquiries are newest-first).
  const bookingStatus = {};
  for (const e of enquiries) {
    if (!(e.advocateId in bookingStatus)) bookingStatus[e.advocateId] = e.status;
  }

  return (
    <AccountView
      user={user}
      activity={activity}
      bookingStatus={bookingStatus}
      consultations={consultations}
    />
  );
}
