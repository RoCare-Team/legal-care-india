import { redirect } from 'next/navigation';
import { createMetadata } from '@/lib/metadata';
import { Container } from '@/components/ui';
import UserLoginForm from '@/components/auth/UserLoginForm';
import { getSession } from '@/lib/auth';

export const metadata = createMetadata({
  title: 'Log In',
  description: 'Log in to your Legal Care India account.',
  path: '/user/login',
});

export default async function UserLoginPage() {
  const session = await getSession();
  if (session?.role === 'user') redirect('/account');
  if (session?.role === 'advocate') redirect('/dashboard');

  return (
    <Container className="py-10 sm:py-16">
      <div className="mx-auto w-full max-w-md">
        <UserLoginForm />
      </div>
    </Container>
  );
}
