'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils/cn';
import { MAIN_NAV } from '@/constants/navigation';

/**
 * Navbar — desktop primary navigation links with active-route highlighting.
 *
 * @param {object} props
 * @param {string} [props.className]
 */
export default function Navbar({ className }) {
  const pathname = usePathname();

  return (
    <nav className={cn('items-center gap-1', className)} aria-label="Primary">
      {MAIN_NAV.map(({ label, href }) => {
        const active =
          href === '/' ? pathname === '/' : pathname.startsWith(href.split('#')[0]);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              active ? 'text-primary' : 'text-ink/70 hover:text-ink hover:bg-ink/5'
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
