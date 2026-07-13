'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Scale, LogOut, ArrowLeft } from 'lucide-react';
import { ADMIN_NAV } from '@/constants/adminNav';
import { cn } from '@/utils/cn';

/**
 * AdminSidebar — the fixed, full-height dark navigation rail for the admin
 * panel (desktop only; a horizontal nav covers mobile). Shows the brand, the
 * section links, the signed-in admin and log-out.
 *
 * @param {object} props
 * @param {string} props.adminEmail
 */
export default function AdminSidebar({ adminEmail }) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => {});
    router.refresh();
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-[#0F172A] text-white lg:flex">
      {/* Brand */}
      <div className="flex items-center gap-2.5 border-b border-white/10 px-5 py-[1.15rem]">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-white shadow-lg shadow-primary/30">
          <Scale className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="leading-tight">
          <p className="font-display text-sm font-bold">Legal Care</p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">Admin</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3">
        <p className="px-3 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-wider text-white/35">
          Manage
        </p>
        <ul className="space-y-1">
          {ADMIN_NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    active ? 'bg-white/10 text-white' : 'text-white/55 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Icon
                    className={cn('h-4 w-4 shrink-0 transition-colors', active ? 'text-accent' : 'text-white/45 group-hover:text-white/80')}
                    aria-hidden="true"
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-3">
        <div className="mb-1 flex items-center gap-2.5 rounded-xl px-3 py-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-semibold uppercase text-white/80">
            {adminEmail?.charAt(0) || 'A'}
          </span>
          <p className="min-w-0 truncate text-xs text-white/50">{adminEmail}</p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/55 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to site
        </Link>
        <button
          type="button"
          onClick={logout}
          className="mt-0.5 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-300 transition-colors hover:bg-red-500/10 hover:text-red-200"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Log out
        </button>
      </div>
    </aside>
  );
}
