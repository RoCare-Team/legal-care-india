'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { LayoutDashboard, LogOut, UserRound, ChevronDown, Scale, Wallet } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useDisclosure } from '@/hooks/useDisclosure';
import { logout } from '@/utils/logout';

/** Extra classes that make a "ghost" button legible on the dark navy header. */
const GHOST_ON_DARK = 'text-white hover:bg-white/10 hover:text-white';

/**
 * HeaderAuth — desktop auth actions for the header.
 * Logged out: two compact dropdowns (Log in / Sign up) that each expose the
 * User and Lawyer options, keeping the navbar tidy. Logged in: role-aware
 * account link + log out.
 */
export default function HeaderAuth({ onDark = false }) {
  const { role, user } = useAuth();

  // On the dark header: ghost buttons get light text, the solid CTA turns gold.
  const ghostClass = onDark ? GHOST_ON_DARK : undefined;
  const ctaVariant = onDark ? 'accent' : 'primary';

  // No blank placeholder while the session is being read. It used to render an
  // empty 160px box until /api/auth/me came back, which on a real connection
  // meant the account buttons appeared a beat after the rest of the bar — they
  // looked like they were waiting for something. Signed out is both the safe
  // assumption and the common one, and `useAuth` corrects it immediately for
  // anyone this browser has seen signed in before.

  if (role === 'advocate') {
    return (
      <div className="flex items-center gap-2">
        <Button href="/dashboard" variant="ghost" size="sm" className={ghostClass} leftIcon={<LayoutDashboard className="h-4 w-4" />}>
          Dashboard
        </Button>
        <LogoutButton variant={ctaVariant} />
      </div>
    );
  }

  if (role === 'user') {
    return (
      <div className="flex items-center gap-2">
        {/* The balance, where money belongs — in sight before a consultation is
            started, not one click away on the account page. It links to the
            wallet tab, so "I need to top up" is a single tap from anywhere. */}
        <Link
          href="/account?tab=wallet"
          title="Wallet balance — tap to add money"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1.5 text-[13px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200 transition-colors hover:bg-emerald-100"
        >
          <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="tabular-nums">
            ₹{Number(user?.walletBalance || 0).toLocaleString('en-IN')}
          </span>
          <span className="sr-only">wallet balance</span>
        </Link>
        <Button href="/account" variant="ghost" size="sm" className={ghostClass} leftIcon={<UserRound className="h-4 w-4" />}>
          My Account
        </Button>
        <LogoutButton variant={ctaVariant} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <AuthDropdown
        label="Log in"
        variant="ghost"
        className={ghostClass}
        items={[
          { icon: UserRound, label: 'As a User', sub: 'Client account', href: '/user/login' },
          { icon: Scale, label: 'As a Lawyer', sub: 'Manage your profile', href: '/login' },
        ]}
      />
      <AuthDropdown
        label="Sign up"
        variant={ctaVariant}
        items={[
          { icon: UserRound, label: 'Sign up as User', sub: 'Free client account', href: '/user/signup' },
          { icon: Scale, label: 'Register as Lawyer', sub: 'List your practice', href: '/register' },
        ]}
      />
    </div>
  );
}

function LogoutButton({ variant = 'primary' }) {
  return (
    <Button type="button" onClick={() => logout('/')} variant={variant} size="sm" leftIcon={<LogOut className="h-4 w-4" />}>
      Log out
    </Button>
  );
}

function AuthDropdown({ label, variant, className, items }) {
  const menu = useDisclosure(false);
  const ref = useRef(null);
  const { close } = menu;

  useEffect(() => {
    if (!menu.isOpen) return undefined;
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) close();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menu.isOpen, close]);

  return (
    <div className="relative" ref={ref}>
      <Button
        type="button"
        variant={variant}
        size="sm"
        className={className}
        onClick={menu.toggle}
        rightIcon={
          <ChevronDown
            className={`h-4 w-4 transition-transform ${menu.isOpen ? 'rotate-180' : ''}`}
          />
        }
      >
        {label}
      </Button>

      {menu.isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-ink/10 bg-surface p-1.5 shadow-card-hover">
          {items.map(({ icon: Icon, label: itemLabel, sub, href }) => (
            <Link
              key={href}
              href={href}
              onClick={menu.close}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-primary/5"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-ink">{itemLabel}</span>
                <span className="block text-xs text-ink/50">{sub}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
