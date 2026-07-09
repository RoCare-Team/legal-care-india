import { redirect } from 'next/navigation';
import { Container } from '@/components/ui';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardTopbar from '@/components/dashboard/DashboardTopbar';
import { getSessionAdvocateId } from '@/lib/auth';
import { getAdvocateById } from '@/lib/advocates';

export const metadata = {
  title: 'Advocate Dashboard | Legal Care India',
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
  if (!advocate) redirect('/login');

  return (
    <Container className="py-8 sm:py-10">
      <DashboardTopbar advocate={advocate} />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="min-w-0 lg:col-span-1">
          <DashboardSidebar />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}
