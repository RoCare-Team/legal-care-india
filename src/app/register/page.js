import Link from 'next/link';
import { createMetadata } from '@/lib/metadata';
import { Container } from '@/components/ui';
import RegisterWizard from '@/components/register/RegisterWizard';
import RegisterAside from '@/components/register/RegisterAside';
import { getAllCities } from '@/lib/cities';

export const metadata = createMetadata({
  title: 'Register as a Lawyer',
  description:
    'Create your free verified lawyer profile on Justiceland and start receiving direct client enquiries by call, WhatsApp and email.',
  path: '/register',
});

export default async function RegisterPage() {
  // Built-in cities plus any an admin added, so a new city is selectable the
  // moment it's created.
  const cities = await getAllCities();

  return (
    <Container className="py-5 sm:py-7">
      {/* One line, not a hero. This page's job is the form below it, and a
          four-line masthead pushed the first field off the fold on a laptop. */}
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="font-display text-xl font-semibold text-ink sm:text-2xl">
          Register as a Lawyer
        </h1>
        <p className="text-sm text-ink/60">
          Already registered?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
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
