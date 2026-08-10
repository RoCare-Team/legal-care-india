'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils/cn';
import { MAIN_NAV } from '@/constants/navigation';

/**
 * Navbar — desktop primary navigation.
 *
 * The current page is a filled pill rather than a different shade of text, so
 * "where am I" is a shape and not a colour — the only cue a colour-blind
 * visitor could rely on before.
 *
 * No container of its own: the header bar is already a white surface, and a
 * white capsule inside a white bar is an edge nobody can see.
 *
 * @param {object} props
 * @param {string} [props.className]
 */
export default function Navbar({ className }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className={cn('items-center gap-0.5', className)}>
      {MAIN_NAV.map(({ label, href }) => {
        const active =
          href === '/' ? pathname === '/' : pathname.startsWith(href.split('#')[0]);

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              // The bar is at its tightest the moment this nav appears, at xl,
              // and loosens from there — hence the padding growing rather than
              // starting wide and being clawed back.
              'whitespace-nowrap rounded-full px-2.5 py-1.5 text-[14.5px] transition-colors 2xl:px-3.5',
              active
                ? 'bg-primary/[0.09] font-bold text-primary'
                : 'font-medium text-ink/65 hover:bg-ink/[0.04] hover:text-ink'
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
