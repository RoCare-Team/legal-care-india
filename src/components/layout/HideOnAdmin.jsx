'use client';

import { usePathname } from 'next/navigation';

/**
 * Where the public site's header, footer and location gate do NOT belong.
 *
 * Two kinds of route opt out, for the same reason: they are not pages of the
 * public site, they are applications that happen to live at the same domain.
 *
 *   /admin  — the admin panel, which has its own chrome entirely.
 *   /setup  — the guided profile setup. It asks a lawyer for one thing at a
 *             time and every competing link on the screen is an invitation to
 *             leave halfway through, which is precisely the failure it exists
 *             to prevent. It carries its own minimal header instead.
 *
 * Kept as a path list rather than a prop threaded through the root layout,
 * because the root layout is a server component and this decision needs the
 * pathname.
 */
const STANDALONE = ['/admin', '/setup'];

export default function HideOnAdmin({ children }) {
  const pathname = usePathname();
  if (STANDALONE.some((p) => pathname === p || pathname?.startsWith(`${p}/`))) return null;
  return children;
}
