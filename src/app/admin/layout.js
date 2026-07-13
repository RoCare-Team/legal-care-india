import { Scale } from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminMobileNav from '@/components/admin/AdminMobileNav';
import AdminLogin from '@/components/admin/AdminLogin';
import AdminLogoutButton from '@/components/admin/AdminLogoutButton';
import { getAdminSession } from '@/lib/admin';

export const metadata = {
  title: 'Admin | Legal Care India',
  robots: { index: false, follow: false },
};

// Admin pages read live data per request — never cache.
export const dynamic = 'force-dynamic';

/**
 * Admin shell — a full-width app layout with a dark sidebar. When there's no
 * admin session it renders the login screen instead (and never renders the
 * guarded pages, so no data is fetched).
 */
export default async function AdminLayout({ children }) {
  const admin = await getAdminSession();

  if (!admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <AdminLogin />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar adminEmail={admin.email} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="flex items-center justify-between border-b border-ink/8 bg-surface px-4 py-3 lg:hidden">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-white">
              <Scale className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="font-display text-sm font-bold text-ink">
              Legal Care <span className="text-primary">Admin</span>
            </span>
          </div>
          <AdminLogoutButton />
        </header>
        <AdminMobileNav />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
