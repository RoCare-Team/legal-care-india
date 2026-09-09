import { redirect } from 'next/navigation';
import { createMetadata } from '@/lib/metadata';
import { getSessionAdvocateId } from '@/lib/auth';
import { advocateExists } from '@/lib/advocates';
import { Container } from '@/components/ui';
import AdvocateAuthForm from '@/components/auth/AdvocateAuthForm';
import RegisterAside from '@/components/register/RegisterAside';

export const metadata = createMetadata({
  title: 'Lawyer Login',
  description: 'Sign in to your Justiceland lawyer dashboard to manage your public profile.',
  path: '/login',
  noindex: true,
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

export default async function LoginPage({ searchParams }) {
  const id = await getSessionAdvocateId();
  if (id && (await advocateExists(id))) {
    const params = await searchParams;
    redirect(safeRedirect(params?.redirect));
  }

  return (
    <Container className="py-10 sm:py-16">
      <div className="grid items-start gap-8 lg:grid-cols-2">
        <div className="mx-auto w-full max-w-md lg:mx-0">
          <AdvocateAuthForm intent="login" />
        </div>
        <div className="hidden lg:block">
          <RegisterAside />
        </div>
      </div>
    </Container>
  );
}
