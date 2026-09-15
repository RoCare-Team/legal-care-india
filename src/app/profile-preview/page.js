import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, EyeOff, Clock } from 'lucide-react';
import { getSessionAdvocateId } from '@/lib/auth';
import { getAdvocateById, getRelatedAdvocates } from '@/lib/advocates';
import { advocateProfilePath } from '@/utils/advocateUrl';
import AdvocateProfileBody from '@/components/profile/AdvocateProfileBody';

/**
 * /profile-preview — a lawyer's own profile, exactly as the public will see
 * it, while it is still waiting for admin approval.
 *
 * The public page 404s an unapproved profile, and should: nothing is visible
 * before approval. But the lawyer filling it in needs to see what they are
 * building, and "Page Not Found" for their own name reads as broken. This is
 * the lawyer's counterpart to the admin preview — same components as the real
 * page, visible only to the signed-in lawyer it belongs to.
 *
 * Once published there is nothing to preview, so it forwards to the real page.
 */
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Profile Preview | Justiceland',
  robots: { index: false, follow: false },
};

export default async function ProfilePreviewPage() {
  const id = await getSessionAdvocateId();
  if (!id) redirect('/login?redirect=/profile-preview');

  const advocate = await getAdvocateById(id).catch(() => null);
  if (!advocate) redirect('/api/auth/logout?next=/login');

  if (advocate.status === 'published') redirect(`/lawyers/${advocateProfilePath(advocate)}`);

  const related = getRelatedAdvocates(advocate, 3);

  const notice = (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <p className="flex items-start gap-2 text-sm font-semibold text-amber-900">
        <EyeOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        Preview — only you can see this page right now.
      </p>
      <p className="mt-1 flex items-start gap-2 pl-6 text-xs text-amber-800">
        <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>
          Your profile is under review. Once our team approves it, it goes live for clients at
          {' '}/lawyers/{advocateProfilePath(advocate)}.
        </span>
      </p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 pl-6 text-xs font-semibold text-amber-900">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 underline">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to dashboard
        </Link>
        <Link href="/dashboard/profile" className="underline">
          Edit profile
        </Link>
      </div>
    </div>
  );

  return <AdvocateProfileBody advocate={advocate} related={related} notice={notice} />;
}
