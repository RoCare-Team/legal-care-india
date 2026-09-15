import { redirect } from 'next/navigation';
import PortalSidebar from '@/components/dashboard/portal/PortalSidebar';
import PortalAppBar from '@/components/dashboard/portal/PortalAppBar';
import DashboardMobileNav from '@/components/dashboard/DashboardMobileNav';
import { LiveInboxProvider } from '@/components/dashboard/overview/LiveInbox';
import { getSession, getSessionAdvocateId } from '@/lib/auth';
import { getAdvocateById } from '@/lib/advocates';
import ExitImpersonation from '@/components/admin/ExitImpersonation';
import { lawyerProfileHref } from '@/utils/advocateUrl';

export const metadata = {
  title: 'Lawyer Portal | Justiceland',
  robots: { index: false, follow: false },
};

/**
 * The lawyer portal shell — a standalone app, not a page of the public site
 * (the site header and footer are dropped for /dashboard, see HideOnAdmin):
 * navy sidebar on desktop, a sticky app bar, and a tab bar on phones.
 *
 * The live inbox is polled once here, so the bell, the sidebar badge and the
 * overview's request panels all read the same data.
 */
export default async function DashboardLayout({ children }) {
  const id = await getSessionAdvocateId();
  if (!id) redirect('/login');

  const advocate = await getAdvocateById(id);
  // A valid token whose account is gone. Redirecting straight to /login would
  // bounce back here — that page sends a signed-in lawyer to the dashboard —
  // so the cookie has to be cleared on the way, which only a route handler can
  // do. This is the exact loop that showed a blank page.
  if (!advocate) redirect('/api/auth/logout?next=/login');

  const session = await getSession();

  const lawyer = {
    name: `Adv. ${String(advocate.name || '').replace(/^Adv\.?\s*/i, '')}`,
    photo: advocate.photo || '',
    available: Boolean(advocate.available),
    profileHref: lawyerProfileHref(advocate),
    // Unapproved profiles link to a private preview, and are labelled so.
    published: advocate.status === 'published',
  };

  return (
    <LiveInboxProvider>
      <div className="flex min-h-screen bg-muted">
        <PortalSidebar lawyer={lawyer} />

        <div className="flex min-w-0 flex-1 flex-col">
          <PortalAppBar lawyer={lawyer} />

          {session?.impersonated && (
            <div className="flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-xs text-amber-900 sm:px-6 lg:px-8">
              <span>You are viewing this lawyer&apos;s portal as an admin.</span>
              <ExitImpersonation role="advocate" className="py-1 text-amber-900" />
            </div>
          )}

          <div className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
            <div className="mx-auto w-full max-w-[84rem]">{children}</div>
          </div>
        </div>

        <DashboardMobileNav />
      </div>
    </LiveInboxProvider>
  );
}
