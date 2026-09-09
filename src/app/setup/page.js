import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import ProfileSetupStepper from '@/components/dashboard/ProfileSetupStepper';
import AccountDetailsStep from '@/components/dashboard/AccountDetailsStep';
import { SIGNUP_COOKIE, readSignupToken } from '@/lib/advocateOtp';
import { getSessionAdvocateId } from '@/lib/auth';
import { getRawAdvocateById } from '@/lib/advocates';
import { getAllCities } from '@/lib/cities';
import { toEditableSnapshot } from '@/lib/advocateSnapshot';
import { advocateProfilePath } from '@/utils/advocateUrl';

export const metadata = {
  title: 'Complete your profile | Justiceland',
  robots: { index: false, follow: false },
};

/**
 * The guided profile setup, deliberately outside /dashboard.
 *
 * Not a stylistic choice. Under /dashboard it would inherit the sidebar, and a
 * sidebar is a list of eleven other places to be — offered to somebody who has
 * just registered and does not yet know what any of them are for. The whole
 * point of a guided setup is that there is one thing to do next; a navigation
 * rail beside it argues the opposite.
 *
 * The public header and footer are dropped for the same reason (see
 * HideOnAdmin), so this page carries its own way out instead of six.
 *
 * Serves two states. With a session it is the guided setup over an existing
 * account. Without one, but with the proof set when a code was verified, it is
 * the step that creates the account — same chrome, same rail, so registration
 * and setup read as one flow rather than a form and then a different product.
 *
 * Reads the stored record rather than the public profile — the public one
 * invents an about paragraph and an office address for profiles that have
 * none, and this page exists to point at exactly those gaps. With images,
 * because the save endpoint writes `photo` whenever the body carries one.
 */
export default async function SetupPage({ searchParams }) {
  const params = await searchParams;

  // The record first, then the decision — not the other way round. A signed
  // token outlives the account it names, and reading it as "this is a session"
  // before checking is what sent a lawyer who had just verified their number
  // back to the login page: the dead token won over the fresh proof beside it.
  const id = await getSessionAdvocateId();
  const advocate = id ? await getRawAdvocateById(id, { withImages: true }) : null;

  if (advocate) {
    const cities = await getAllCities();
    return (
      <ProfileSetupStepper
        initial={toEditableSnapshot(advocate)}
        cities={cities}
        previewHref={advocateProfilePath(advocate)}
        advocateName={advocate.name}
        justJoined={params?.new === '1'}
        status={advocate.status}
      />
    );
  }

  // No live account. A number proved a code minutes ago, though, so this is a
  // lawyer part way through registering — the first step is the one that
  // creates the account.
  const store = await cookies();
  const phone = readSignupToken(store.get(SIGNUP_COOKIE)?.value);
  if (phone) {
    const cities = await getAllCities();
    return <AccountDetailsStep phone={phone} cities={cities} />;
  }

  // Neither. If a dead token is lying around, it leaves through the route that
  // can actually remove it — otherwise it keeps making this decision wrongly
  // on every visit.
  redirect(id ? '/api/auth/logout?next=/login' : '/login?redirect=/setup');
}
