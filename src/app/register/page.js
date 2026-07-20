import Link from 'next/link';
import { createMetadata } from '@/lib/metadata';
import { Container } from '@/components/ui';
import RegisterWizard from '@/components/register/RegisterWizard';
import RegisterAside from '@/components/register/RegisterAside';
import { getAllCities } from '@/lib/cities';

export const metadata = createMetadata({
  title: 'Register as an Advocate',
  description:
    'Create your free verified advocate profile on Legal Care India and start receiving direct client enquiries by call, WhatsApp and email.',
  path: '/register',
});

export default async function RegisterPage() {
  // Built-in cities plus any an admin added, so a new city is selectable the
  // moment it's created.
  const cities = await getAllCities();

  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto mb-8 max-w-2xl text-center lg:mx-0 lg:max-w-none lg:text-left">
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
          Register as an Advocate
        </h1>
        <p className="mt-2 text-ink/60">
          Already registered?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in to your dashboard
          </Link>
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RegisterWizard cities={cities} />
        </div>
        <div className="lg:col-span-1">
          <RegisterAside />
        </div>
      </div>
    </Container>
  );
}
