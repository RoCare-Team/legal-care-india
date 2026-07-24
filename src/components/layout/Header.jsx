'use client';

import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils/cn';
import Logo from '@/components/shared/Logo';
import Navbar from './Navbar';
import MobileMenu from './MobileMenu';
import HeaderAuth from './HeaderAuth';
import { useScrollPosition } from '@/hooks/useScrollPosition';
import { useDisclosure } from '@/hooks/useDisclosure';

/**
 * Header — top bar with logo, desktop nav, CTAs and a mobile menu trigger.
 *
 * On the homepage it floats transparently over the dark hero (fixed, so the
 * hero image runs up behind it) and switches to a solid light bar the moment
 * the page is scrolled. Every other route keeps the plain sticky light bar,
 * where transparent-white text would be invisible.
 */
export default function Header() {
  const scrollY = useScrollPosition();
  const menu = useDisclosure(false);
  const scrolled = scrollY > 8;

  // Only the homepage has a dark hero for the bar to sit on.
  const overlay = usePathname() === '/';
  // Light text/logo only while actually floating over that hero.
  const onDark = overlay && !scrolled;

  return (
    <>
    <header
      className={cn(
        'z-40 w-full border-b transition-colors duration-200',
        overlay ? 'fixed top-0 left-0' : 'sticky top-0',
        onDark
          ? 'border-transparent bg-transparent'
          : scrolled
            ? 'border-ink/10 bg-surface/95 backdrop-blur-md shadow-sm'
            : 'border-ink/8 bg-surface'
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo onDark={onDark} />

        <Navbar className="hidden lg:flex" onDark={onDark} />

        <div className="hidden items-center gap-2 lg:flex">
          <HeaderAuth onDark={onDark} />
        </div>

        <button
          type="button"
          onClick={menu.open}
          aria-label="Open menu"
          className={cn(
            'grid h-10 w-10 place-items-center rounded-lg lg:hidden',
            onDark ? 'text-white hover:bg-white/10' : 'text-ink/70 hover:bg-ink/5'
          )}
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>
    </header>

    {/* Rendered OUTSIDE the header so the header's backdrop-blur (a containing
        block for fixed elements) can't break the drawer's full-screen overlay. */}
    <MobileMenu isOpen={menu.isOpen} onClose={menu.close} />
    </>
  );
}
