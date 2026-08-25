import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, EyeOff } from 'lucide-react';
import { getAdminSession } from '@/lib/admin';
import { getAdvocateById, getRelatedAdvocates } from '@/lib/advocates';
import { advocateProfilePath } from '@/utils/advocateUrl';
import AdvocateProfileBody from '@/components/profile/AdvocateProfileBody';

/**
 * /admin/advocates/[id]/preview — the public profile, as it will look, for a
 * lawyer who has not been approved yet.
 *
 * The public page 404s an unapproved profile, which is right: the whole point
 * of approval is that nothing is visible before it. But that left an admin
 * unable to look at the profile they were being asked to approve. This is that
 * missing view — same components as the real page, so what is approved is what
 * goes live.
 *
 * Never cached and never prerendered: it reads the admin cookie, and it must
 * show whatever the lawyer saved a moment ago.
 */
export const dynamic = 'force-dynamic';

export const metadata = { robots: { index: false, follow: false } };

export default async function AdvocatePreviewPage({ params }) {
  const admin = await getAdminSession();
  // Not an admin: this route should not even admit that the profile exists.
  if (!admin) notFound();

  const { id } = await params;
  const advocate = await getAdvocateById(id).catch(() => null);
  if (!advocate) notFound();

  const related = getRelatedAdvocates(advocate, 3);
  const published = advocate.status === 'published';

  const notice = (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <p className="flex items-start gap-2 text-sm font-semibold text-amber-900">
        <EyeOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        {published
          ? 'Admin preview — this profile is live.'
          : 'Admin preview — awaiting approval, so nobody else can see this page yet.'}
      </p>
      <p className="mt-1 pl-6 text-xs text-amber-800">
        {published ? (
          <>
            The public address is{' '}
            <Link href={`/lawyers/${advocateProfilePath(advocate)}`} className="font-medium underline">
              /lawyers/{advocateProfilePath(advocate)}
            </Link>
            .
          </>
        ) : (
          <>Approve it from the Lawyers list to publish it at /lawyers/{advocateProfilePath(advocate)}.</>
        )}
      </p>
      <Link
        href={`/admin/advocates/${id}`}
        className="mt-2 inline-flex items-center gap-1.5 pl-6 text-xs font-semibold text-amber-900 underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to this lawyer in the panel
      </Link>
    </div>
  );

  return <AdvocateProfileBody advocate={advocate} related={related} notice={notice} />;
}
