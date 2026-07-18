'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { LayoutDashboard, LogOut, UserRound, ChevronDown, Scale, Wallet } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useDisclosure } from '@/hooks/useDisclosure';
import { logout } from '@/utils/logout';

/** Compact rupee label, e.g. 1500 -> "₹1,500". */
function formatMoney(value = 0) {
  return `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

/** Extra classes that make a "ghost" button legible on the dark navy header. */
const GHOST_ON_DARK = 'text-white hover:bg-white/10 hover:text-white';

/** Wallet pill for signed-in users — shows balance, links to the wallet tab. */
function WalletPill({ balance = 0 }) {
  return (
    <Link
      href="/account?tab=wallet"
      title="Your wallet"
      className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-surface px-3 py-1.5 text-sm font-semibold text-ink shadow-sm transition-colors hover:border-primary/40 hover:text-primary"
    >
      <Wallet className="h-4 w-4 text-primary" aria-hidden="true" />
      {formatMoney(balance)}
    </Link>
  );
}

/**
 * HeaderAuth — desktop auth actions for the header.
 * Logged out: two compact dropdowns (Log in / Sign up) that each expose the
 * User and Advocate options, keeping the navbar tidy. Logged in: role-aware
 * account link + log out.
 */
export default function HeaderAuth({ onDark = false }) {
  const { role, user, loading } = useAuth();

  // On the dark header: ghost buttons get light text, the solid CTA turns gold.
  const ghostClass = onDark ? GHOST_ON_DARK : undefined;
  const ctaVariant = onDark ? 'accent' : 'primary';

  if (loading) return <div className="h-9 w-40" aria-hidden="true" />;

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
        <WalletPill balance={user?.walletBalance || 0} />
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
          { icon: Scale, label: 'As an Advocate', sub: 'Manage your profile', href: '/login' },
        ]}
      />
      <AuthDropdown
        label="Sign up"
        variant={ctaVariant}
        items={[
          { icon: UserRound, label: 'Sign up as User', sub: 'Free client account', href: '/user/signup' },
          { icon: Scale, label: 'Register as Advocate', sub: 'List your practice', href: '/register' },
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
