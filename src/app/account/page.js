import { redirect } from 'next/navigation';
import { createMetadata } from '@/lib/metadata';
import { Container } from '@/components/ui';
import AccountView from '@/components/account/AccountView';
import { getSessionUserId } from '@/lib/auth';
import { getUserById } from '@/lib/users';

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

  return (
    <Container className="py-10 sm:py-16">
      <AccountView user={user} />
    </Container>
  );
}
