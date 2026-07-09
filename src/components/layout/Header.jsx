'use client';

import { Menu, LayoutDashboard, LogOut } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui';
import Logo from '@/components/shared/Logo';
import Navbar from './Navbar';
import MobileMenu from './MobileMenu';
import { AUTH_NAV } from '@/constants/navigation';
import { useScrollPosition } from '@/hooks/useScrollPosition';
import { useDisclosure } from '@/hooks/useDisclosure';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/utils/logout';

/**
 * Header — sticky top bar with logo, desktop nav, CTAs and a mobile menu trigger.
 * Gains a subtle border + shadow once the page is scrolled.
 */
export default function Header() {
  const scrollY = useScrollPosition();
  const menu = useDisclosure(false);
  const scrolled = scrollY > 8;
  const { advocate, loading } = useAuth();

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
          {loading ? null : advocate ? (
            <>
              <Button
                href="/dashboard"
                variant="ghost"
                size="sm"
                leftIcon={<LayoutDashboard className="h-4 w-4" />}
              >
                Dashboard
              </Button>
              <Button
                type="button"
                onClick={() => logout('/')}
                size="sm"
                leftIcon={<LogOut className="h-4 w-4" />}
              >
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button href={AUTH_NAV.login.href} variant="ghost" size="sm">
                {AUTH_NAV.login.label}
              </Button>
              <Button href={AUTH_NAV.register.href} size="sm">
                {AUTH_NAV.register.label}
              </Button>
            </>
          )}
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
