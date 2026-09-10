import { redirect } from 'next/navigation';
import { createMetadata } from '@/lib/metadata';
import AuthLayout from '@/components/auth/AuthLayout';
import UserLoginForm from '@/components/auth/UserLoginForm';
import { getSession } from '@/lib/auth';

export const metadata = createMetadata({
  title: 'Log In',
  description: 'Log in to your Justiceland account.',
  path: '/user/login',
  noindex: true,
});

export default async function UserLoginPage() {
  const session = await getSession();
  if (session?.role === 'user') redirect('/account');
  if (session?.role === 'advocate') redirect('/dashboard');

  return (
    <AuthLayout imageAlt="">
      <UserLoginForm />
    </AuthLayout>
  );
}
