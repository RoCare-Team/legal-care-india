'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils/cn';
import { DASHBOARD_NAV } from '@/constants/dashboard';

/**
 * DashboardSidebar — grouped vertical navigation for the advocate dashboard.
 * Sticky on desktop; renders as a horizontally scrollable strip on mobile.
 *
 * @param {object} props
 * @param {import('react').ReactNode} [props.footer] Extra control pinned below
 *   the nav. It has to live inside this sticky element, or the pinned nav
 *   scrolls over it.
 */
export default function DashboardSidebar({ footer }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Dashboard" className="lg:sticky lg:top-24">
      <div className="flex gap-4 overflow-x-auto pb-2 lg:block lg:space-y-6 lg:overflow-visible lg:pb-0">
        {DASHBOARD_NAV.map((group) => (
          <div key={group.title} className="min-w-max lg:min-w-0">
            <p className="mb-2 hidden px-3 text-xs font-semibold uppercase tracking-wide text-ink/40 lg:block">
              {group.title}
            </p>
            <ul className="flex gap-1 lg:flex-col">
              {group.items.map((item) => {
                const base = item.href.split('#')[0];
                const active = !item.external && pathname === base;
                const Icon = item.icon;
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      target={item.external ? '_blank' : undefined}
                      rel={item.external ? 'noopener noreferrer' : undefined}
                      className={cn(
                        'flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'text-ink/65 hover:bg-ink/5 hover:text-ink'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      {footer}
    </nav>
  );
}
