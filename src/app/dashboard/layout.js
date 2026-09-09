import { redirect } from 'next/navigation';
import { Container } from '@/components/ui';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardTopbar from '@/components/dashboard/DashboardTopbar';
import { getSession, getSessionAdvocateId } from '@/lib/auth';
import { getAdvocateById } from '@/lib/advocates';
import ExitImpersonation from '@/components/admin/ExitImpersonation';

export const metadata = {
  title: 'Lawyer Dashboard | Justiceland',
  robots: { index: false, follow: false },
};

/**
 * Dashboard shell — identity topbar + grouped sidebar + content area.
 * All dashboard routes render inside this layout.
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

  return (
    <Container className="py-8 sm:py-10">
      <DashboardTopbar advocate={advocate} />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="min-w-0 lg:col-span-1">
          <DashboardSidebar
            footer={session?.impersonated ? <ExitImpersonation role="advocate" /> : null}
          />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}
