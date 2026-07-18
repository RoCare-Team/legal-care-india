'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

/** AdminLogoutButton — clears the admin cookie and refreshes to the login screen. */
export default function AdminLogoutButton() {
  const router = useRouter();

  const onLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => {});
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={onLogout}
      className="inline-flex items-center gap-1.5 rounded-lg border border-ink/15 bg-surface px-3 py-2 text-sm font-medium text-ink hover:border-red-400 hover:text-red-400"
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      Log out
    </button>
  );
}
