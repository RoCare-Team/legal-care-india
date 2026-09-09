import { redirect } from 'next/navigation';
import { getSessionAdvocateId } from '@/lib/auth';
import { advocateExists } from '@/lib/advocates';
import { createMetadata } from '@/lib/metadata';
import AdvocateAuthForm from '@/components/auth/AdvocateAuthForm';
import AuthLayout, { LAWYER_BENEFITS } from '@/components/auth/AuthLayout';

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
    // The same shell the client sign-in uses, with the panel speaking to a
    // different audience: a client asks whether the site can be trusted, a
    // lawyer asks whether it is worth their time, so the promise and the four
    // points change while everything around them stays put.
    <AuthLayout
      headline={`Join Our Legal Network
Make a Bigger Impact.`}
      benefits={LAWYER_BENEFITS}
      image="/lawyer-register.png"
    >
      <AdvocateAuthForm intent="register" />
    </AuthLayout>
  );
}
