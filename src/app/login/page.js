import { createMetadata } from '@/lib/metadata';
import { Container } from '@/components/ui';
import LoginForm from '@/components/auth/LoginForm';
import RegisterAside from '@/components/register/RegisterAside';

export const metadata = createMetadata({
  title: 'Lawyer Login',
  description: 'Sign in to your Legal Care India lawyer dashboard to manage your public profile.',
  path: '/login',
});

export default function LoginPage() {
  return (
    <Container className="py-10 sm:py-16">
      <div className="grid items-start gap-8 lg:grid-cols-2">
        <div className="mx-auto w-full max-w-md lg:mx-0">
          <LoginForm />
        </div>
        <div className="hidden lg:block">
          <RegisterAside />
        </div>
      </div>
    </Container>
  );
}
