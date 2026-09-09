import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionAdvocateId } from '@/lib/auth';
import { advocateExists } from '@/lib/advocates';
import { createMetadata } from '@/lib/metadata';
import { Container } from '@/components/ui';
import AdvocateAuthForm from '@/components/auth/AdvocateAuthForm';
import RegisterAside from '@/components/register/RegisterAside';

export const metadata = createMetadata({
  title: 'Register as a Lawyer',
  description:
    'Create your free verified lawyer profile on Justiceland and start receiving direct client enquiries by call, WhatsApp and email.',
  path: '/register',
});


/**
 * Already signed in? Then this page has nothing to ask.
 *
 * Signing in is a code sent to a number, so a lawyer who still has a session
 * would otherwise be made to receive and type one to reach a dashboard they
 * were already entitled to. `redirect` is honoured so a link that sent them
 * here on the way to somewhere else still finishes the journey — same-site
 * only, because an absolute URL here would make this an open redirect.
 *
 * The account is checked, not just the token. A signed cookie outlives the
 * record it points at, and bouncing such a visitor to a dashboard that bounces
 * them straight back here is a redirect loop — a blank page with no way out.
 */
function safeRedirect(target) {
  const t = String(target || '');
  return t.startsWith('/') && !t.startsWith('//') ? t : '/dashboard';
}

export default async function RegisterPage() {
  // A signed-in lawyer asking to register already has an account; the useful
  // page is the one where they finish the profile it belongs to.
  const id = await getSessionAdvocateId();
  if (id && (await advocateExists(id))) redirect('/setup');

  return (
    <Container className="py-5 sm:py-7">
      {/* One line, not a hero. This page's job is the form below it, and a
          four-line masthead pushed the first field off the fold on a laptop. */}
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="font-display text-xl font-semibold text-ink sm:text-2xl">
          
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
          <AdvocateAuthForm intent="register" />
        </div>
        <div className="lg:col-span-1">
          <RegisterAside />
        </div>
      </div>
    </Container>
  );
}
