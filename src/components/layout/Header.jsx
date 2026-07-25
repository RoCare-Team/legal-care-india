'use client';

import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils/cn';
import Logo from '@/components/shared/Logo';
import Navbar from './Navbar';
import MobileMenu from './MobileMenu';
import HeaderAuth from './HeaderAuth';
import LocationPicker from '@/components/location/LocationPicker';
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
      {/* Roomier than the usual 64px bar: with nav links, a location, a wallet
          and two account actions all on one line, the extra height and the gaps
          are what keep it from reading as a wall of controls. */}
      <div className="mx-auto flex h-[72px] w-full max-w-[86rem] items-center gap-4 px-4 sm:px-6 lg:gap-6 lg:px-8">
        <Logo onDark={onDark} />

        <Navbar className="hidden flex-1 justify-center lg:flex" onDark={onDark} />

        {/* Everything the visitor acts on sits together on the right: where
            they are, their wallet, their account. */}
        <div className="hidden items-center gap-2.5 lg:flex">
          <LocationPicker onDark={onDark} />
          <span className="h-6 w-px bg-current opacity-10" aria-hidden="true" />
          <HeaderAuth onDark={onDark} />
        </div>

        <button
          type="button"
          onClick={menu.open}
          aria-label="Open menu"
          className={cn(
            'ml-auto grid h-10 w-10 place-items-center rounded-lg lg:hidden',
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
