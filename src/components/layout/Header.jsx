'use client';

import { Menu } from 'lucide-react';
import { cn } from '@/utils/cn';
import Logo from '@/components/shared/Logo';
import Navbar from './Navbar';
import MobileMenu from './MobileMenu';
import HeaderAuth from './HeaderAuth';
import { useScrollPosition } from '@/hooks/useScrollPosition';
import { useDisclosure } from '@/hooks/useDisclosure';

/**
 * Header — sticky top bar with logo, desktop nav, CTAs and a mobile menu trigger.
 * Gains a subtle border + shadow once the page is scrolled.
 */
export default function Header() {
  const scrollY = useScrollPosition();
  const menu = useDisclosure(false);
  const scrolled = scrollY > 8;

  return (
    <>
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b transition-colors duration-200',
        scrolled
          ? 'border-ink/8 bg-surface/90 backdrop-blur-md shadow-sm'
          : 'border-transparent bg-surface'
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        <Navbar className="hidden lg:flex" />

        <div className="hidden items-center gap-2 lg:flex">
          <HeaderAuth />
        </div>

        <button
          type="button"
          onClick={menu.open}
          aria-label="Open menu"
          className="grid h-10 w-10 place-items-center rounded-lg text-ink/70 hover:bg-ink/5 lg:hidden"
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
