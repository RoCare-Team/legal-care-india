'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CalendarCheck, MessageCircleMore, Wallet, UserRound } from 'lucide-react';
import { useInbox } from '@/components/dashboard/overview/LiveInbox';
import { cn } from '@/utils/cn';

const ITEMS = [
  { label: 'Home', href: '/dashboard', icon: Home },
  { label: 'Consultations', href: '/dashboard/consultations', icon: CalendarCheck, badge: true },
  { label: 'Messages', href: '/dashboard/messages', icon: MessageCircleMore },
  { label: 'Earnings', href: '/dashboard/earnings', icon: Wallet },
  { label: 'Profile', href: '/dashboard/profile', icon: UserRound },
];

/**
 * DashboardMobileNav — the app-style tab bar pinned to the bottom of the
 * screen on phones. Tablets and desktops navigate from the sidebar (a drawer on tablets).
 */
export default function DashboardMobileNav() {
  const pathname = usePathname();
  const { sessions } = useInbox();
  const pending = sessions.filter((s) => s.status === 'pending').length;

  return (
    <>
      {/* Keeps the page's last lines (the site footer included) clear of the bar. */}
      <style>{`@media (max-width: 767px) { body { padding-bottom: calc(4.25rem + env(safe-area-inset-bottom)); } }`}</style>

      <nav
        aria-label="Dashboard"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-surface/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-12px_rgb(30_58_95/0.18)] backdrop-blur-md md:hidden"
      >
        <ul className="mx-auto grid max-w-xl grid-cols-5">
          {ITEMS.map(({ label, href, icon: Icon, badge }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative flex h-[4.25rem] flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
                    active ? 'text-primary' : 'text-ink/55 hover:text-ink'
                  )}
                >
                  {active && (
                    <span className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-accent" aria-hidden="true" />
                  )}
                  <span className="relative">
                    <Icon
                      className={cn('h-5 w-5', active && 'text-accent')}
                      strokeWidth={active ? 2.4 : 2}
                      aria-hidden="true"
                    />
                    {badge && pending > 0 && (
                      <span className="absolute -right-2.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                        {pending}
                      </span>
                    )}
                  </span>
                  <span className="max-w-full truncate px-1">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
