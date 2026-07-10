'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { LayoutDashboard, LogOut, UserRound, ChevronDown, Scale } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useDisclosure } from '@/hooks/useDisclosure';
import { logout } from '@/utils/logout';

/**
 * HeaderAuth — desktop auth actions for the header.
 * Logged out: two compact dropdowns (Log in / Sign up) that each expose the
 * User and Advocate options, keeping the navbar tidy. Logged in: role-aware
 * account link + log out.
 */
export default function HeaderAuth() {
  const { role, loading } = useAuth();

  if (loading) return <div className="h-9 w-40" aria-hidden="true" />;

  if (role === 'advocate') {
    return (
      <div className="flex items-center gap-2">
        <Button href="/dashboard" variant="ghost" size="sm" leftIcon={<LayoutDashboard className="h-4 w-4" />}>
          Dashboard
        </Button>
        <LogoutButton />
      </div>
    );
  }

  if (role === 'user') {
    return (
      <div className="flex items-center gap-2">
        <Button href="/account" variant="ghost" size="sm" leftIcon={<UserRound className="h-4 w-4" />}>
          My Account
        </Button>
        <LogoutButton />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <AuthDropdown
        label="Log in"
        variant="ghost"
        items={[
          { icon: UserRound, label: 'As a User', sub: 'Client account', href: '/user/login' },
          { icon: Scale, label: 'As an Advocate', sub: 'Manage your profile', href: '/login' },
        ]}
      />
      <AuthDropdown
        label="Sign up"
        variant="primary"
        items={[
          { icon: UserRound, label: 'Sign up as User', sub: 'Free client account', href: '/user/signup' },
          { icon: Scale, label: 'Register as Advocate', sub: 'List your practice', href: '/register' },
        ]}
      />
    </div>
  );
}

function LogoutButton() {
  return (
    <Button type="button" onClick={() => logout('/')} size="sm" leftIcon={<LogOut className="h-4 w-4" />}>
      Log out
    </Button>
  );
}

function AuthDropdown({ label, variant, items }) {
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
