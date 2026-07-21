import { createMetadata } from '@/lib/metadata';
import { Container } from '@/components/ui';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import RegisterAside from '@/components/register/RegisterAside';

export const metadata = {
  ...createMetadata({
    title: 'Forgot Password',
    description: 'Reset your Legal Care India lawyer account password.',
    path: '/forgot-password',
  }),
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <Container className="py-10 sm:py-16">
      <div className="grid items-start gap-8 lg:grid-cols-2">
        <div className="mx-auto w-full max-w-md lg:mx-0">
          <ForgotPasswordForm />
        </div>
        <div className="hidden lg:block">
          <RegisterAside />
        </div>
      </div>
    </Container>
  );
}
