'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ADMIN_NAV } from '@/constants/adminNav';
import { cn } from '@/utils/cn';

/** AdminMobileNav — horizontal, scrollable section nav shown on mobile only. */
export default function AdminMobileNav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-ink/8 bg-surface lg:hidden">
      <ul className="flex gap-1 overflow-x-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ADMIN_NAV.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  active ? 'bg-primary/10 text-primary' : 'text-ink/60 hover:bg-ink/5'
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
  );
}
