'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { X, LayoutDashboard, LogOut } from 'lucide-react';
import { Button } from '@/components/ui';
import Logo from '@/components/shared/Logo';
import { MAIN_NAV, AUTH_NAV } from '@/constants/navigation';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/utils/logout';

/**
 * MobileMenu — slide-in navigation drawer for small screens.
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 */
export default function MobileMenu({ isOpen, onClose }) {
  const { advocate, loading } = useAuth();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.aside
            className="fixed inset-y-0 right-0 z-50 flex w-[82%] max-w-sm flex-col bg-surface shadow-2xl lg:hidden"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
          >
            <div className="flex items-center justify-between border-b border-ink/8 px-5 py-4">
              <Logo />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="grid h-9 w-9 place-items-center rounded-lg text-ink/60 hover:bg-ink/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Mobile primary">
              {MAIN_NAV.map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className="block rounded-xl px-4 py-3 text-base font-medium text-ink/80 hover:bg-primary/5 hover:text-primary"
                >
                  {label}
                </Link>
              ))}
            </nav>

            <div className="space-y-2 border-t border-ink/8 p-5">
              {loading ? null : advocate ? (
                <>
                  <Button
                    href="/dashboard"
                    fullWidth
                    onClick={onClose}
                    leftIcon={<LayoutDashboard className="h-4 w-4" />}
                  >
                    Dashboard
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    fullWidth
                    onClick={() => {
                      onClose();
                      logout('/');
                    }}
                    leftIcon={<LogOut className="h-4 w-4" />}
                  >
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <Button href={AUTH_NAV.register.href} fullWidth onClick={onClose}>
                    {AUTH_NAV.register.label}
                  </Button>
                  <Button
                    href={AUTH_NAV.login.href}
                    variant="outline"
                    fullWidth
                    onClick={onClose}
                  >
                    {AUTH_NAV.login.label}
                  </Button>
                </>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
