import { createMetadata } from '@/lib/metadata';
import { Container } from '@/components/ui';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import RegisterAside from '@/components/register/RegisterAside';

export const metadata = {
  ...createMetadata({
    title: 'Forgot Password',
    description: 'Reset your Justiceland account password.',
    path: '/forgot-password',
  }),
  robots: { index: false, follow: false },
};

/**
 * `?role=user` resets a client account; anything else resets a lawyer account.
 * The two live in separate collections and can share an email, so the role has
 * to travel with the request rather than being guessed from the address.
 */
export default async function ForgotPasswordPage({ searchParams }) {
  const params = await searchParams;
  const role = params?.role === 'user' ? 'user' : 'advocate';

  return (
    <Container className="py-10 sm:py-16">
      <div
        className={
          role === 'user'
            ? 'mx-auto w-full max-w-md'
            : 'grid items-start gap-8 lg:grid-cols-2'
        }
      >
        <div className="mx-auto w-full max-w-md lg:mx-0">
          <ForgotPasswordForm role={role} />
        </div>
        {/* The "grow your practice" pitch is for lawyers — a client resetting
            their password should not be sold a lawyer listing. */}
        {role !== 'user' && (
          <div className="hidden lg:block">
            <RegisterAside />
          </div>
        )}
      </div>
    </Container>
  );
}
