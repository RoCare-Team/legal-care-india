import { redirect } from 'next/navigation';
import { createMetadata } from '@/lib/metadata';
import { Container } from '@/components/ui';
import UserSignupForm from '@/components/auth/UserSignupForm';
import { getSession } from '@/lib/auth';

export const metadata = createMetadata({
  title: 'Sign Up',
  description: 'Create a free Legal Care India account to save advocates and manage your enquiries.',
  path: '/user/signup',
});

export default async function UserSignupPage() {
  const session = await getSession();
  if (session?.role === 'user') redirect('/account');
  if (session?.role === 'advocate') redirect('/dashboard');

  return (
    <Container className="py-10 sm:py-16">
      <div className="mx-auto w-full max-w-md">
        <UserSignupForm />
      </div>
    </Container>
  );
}
