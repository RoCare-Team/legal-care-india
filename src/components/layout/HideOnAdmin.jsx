'use client';

import { usePathname } from 'next/navigation';

/**
 * HideOnAdmin — hides its children on /admin routes so the admin panel renders
 * standalone (no public site header/footer). Everywhere else it renders them
 * unchanged.
 */
export default function HideOnAdmin({ children }) {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;
  return children;
}
